const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models tried in order when one fails with 503/429
const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b'];

/**
 * Retry a Gemini call up to maxRetries times on transient errors (503/overload).
 * Falls back through model list on each attempt.
 */
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn(MODEL_FALLBACKS[Math.min(attempt, MODEL_FALLBACKS.length - 1)]);
    } catch (err) {
      const msg = err.message || '';
      const isTransient = msg.includes('503') || msg.includes('overload') || msg.includes('temporarily');
      const isQuota = msg.includes('429') || msg.includes('quota');

      if (isTransient && attempt < maxRetries - 1) {
        // Wait before retrying: 1s, 2s, 3s
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
        continue;
      }
      throw err; // quota or unknown — propagate
    }
  }
}

/**
 * Generate a friendly bunk suggestion based on attendance stats + mood
 */
async function getBunkSuggestion({ stats, mood, moodHistory }) {
  const moodContext = mood ? `Today's mood: ${mood}.` : 'No mood logged today.';
  const recentMoods = moodHistory?.length
    ? `Recent mood trend (last 7 days): ${moodHistory.map((m) => m.mood).join(', ')}.`
    : '';

  const subjectSummary = stats
    .map((s) =>
      `${s.subject.name}: ${s.percentage}% attendance (threshold: ${s.threshold}%, safe bunks left: ${s.safeBunks}, must-attend: ${s.subject.isMustAttend})`
    )
    .join('\n');

  const prompt = `You are AttendSmart, a helpful AI assistant for a college student.
Your job is to give a short, friendly, practical bunk suggestion for today or this week.

Student's attendance summary:
${subjectSummary}

${moodContext}
${recentMoods}

Rules you must follow:
- Never suggest bunking a must-attend subject
- Never suggest bunking if it would drop attendance below threshold
- Adjust your tone and advice strictly based on today's mood:
  * HAPPY: Be upbeat and celebratory! The student is in a great mood — encourage them to ride the wave, attend classes confidently, and maybe treat a low-risk bunk as a fun reward if safe bunks allow.
  * CHILL: Keep the tone relaxed and easygoing. Suggest a laid-back plan — maybe skip one low-risk class for some me-time if bunks are available, no pressure either way.
  * TIRED: Be gentle and supportive. Recommend rest and suggest safe bunks on low-priority subjects so they can recharge without hurting attendance.
  * STRESSED: Be calm and reassuring. Acknowledge stress, and if they have safe bunks, suggest using one to decompress. Remind them things are manageable.
- Be casual, fun, and student-friendly (but stay factual)
- Keep your response to 3-4 sentences max
- End with a quick risk rating: LOW / MEDIUM / HIGH

Give your suggestion now:`;

  try {
    return await withRetry(async (modelName) => {
      const m = genAI.getGenerativeModel({ model: modelName });
      const result = await m.generateContent(prompt);
      return result.response.text();
    });
  } catch (err) {
    console.error('Gemini suggestion error:', err.message);
    return null;
  }
}

/**
 * Chatbot: answer "can I bunk tomorrow?" style questions
 */
async function chat({ message, stats, conversationHistory }) {
  const subjectSummary = stats
    .map((s) => `${s.subject.name}: ${s.percentage}% (safe bunks: ${s.safeBunks})`)
    .join(', ');

  const systemContext = `You are AttendSmart, a friendly AI attendance advisor for college students.
Current attendance data: ${subjectSummary}
Answer questions about bunking, attendance, and planning. Be concise, friendly, and accurate.
Never recommend unsafe actions. If a bunk is risky, say so clearly.`;

  // Build history — must strictly alternate: user → model → user → model ...
  const rawHistory = conversationHistory || [];
  const validHistory = [];
  for (let i = 0; i + 1 < rawHistory.length; i += 2) {
    if (rawHistory[i].role === 'user' && rawHistory[i + 1].role === 'model') {
      validHistory.push({ role: 'user', parts: [{ text: rawHistory[i].content }] });
      validHistory.push({ role: 'model', parts: [{ text: rawHistory[i + 1].content }] });
    }
  }

  try {
    return await withRetry(async (modelName) => {
      const chatModel = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemContext });
      const chatSession = chatModel.startChat({ history: validHistory });
      const result = await chatSession.sendMessage(message);
      return result.response.text();
    });
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return '⚠️ The AI is unavailable right now — the free API quota for today has been reached. It resets automatically (usually within a few hours). Please try again later!';
    }
    if (err.message?.includes('503') || err.message?.includes('overload')) {
      return '⚠️ The AI servers are overloaded right now. Please try again in a minute!';
    }
    return "Sorry, I couldn't process that right now. Try again in a moment!";
  }
}

/**
 * Extract timetable or calendar data from an image
 */
async function extractFromImage({ buffer, mimeType, type, context }) {
  const modelName = 'gemini-2.5-flash';

  const imagePart = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };

  let prompt = '';

  if (type === 'TIMETABLE') {
    prompt = `You are a helpful assistant that extracts college timetables from images.
Please extract all the classes/lectures shown in this image.
Return the result strictly as a JSON array of objects, with each object having the following keys:
- "subjectName": the string name of the subject extracted from the image.
- "periodNumber": an integer representing the period number (e.g., 1, 2, 3). If not explicitly numbered, try to infer it based on time order.
- "startTime": string in HH:MM format (24-hour).
- "endTime": string in HH:MM format (24-hour).
- "dayOfWeek": string, one of ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].
Do NOT wrap the response in markdown blocks like \`\`\`json. Return only the raw JSON string.`;
  } else if (type === 'CALENDAR') {
    prompt = `You are a helpful assistant that extracts academic calendars from images.
Please extract holidays, semester dates, and exams shown in this image.
CRITICAL EXAM RULES: 
1. ONLY extract Internal Exams (e.g., "Internal Assessment", "IA", "Midterms"). Do NOT extract any external, practical, or final semester exams.
2. If an Internal Exam or any other event spans multiple days (e.g., "June 5 to June 9" or "05-06-2026 to 09-06-2026"), you MUST generate a separate JSON object for EVERY SINGLE DAY in that range, inclusive of the start and end dates.

Return the result strictly as a JSON array of objects, with each object having the following keys:
- "date": string in YYYY-MM-DD format. Assume the current academic year if the year is not specified.
- "type": string, one of ['SEMESTER_START', 'SEMESTER_END', 'HOLIDAY', 'EXAM']. Infer the best fit.
- "label": string, a short title for the event (e.g., "Diwali", "Internal Assessment 1").
Do NOT wrap the response in markdown blocks like \`\`\`json. Return only the raw JSON string.`;
  } else {
    throw new Error('Invalid extraction type');
  }

  try {
    const m = genAI.getGenerativeModel({ model: modelName });
    const result = await m.generateContent([prompt, imagePart]);
    let text = result.response.text();
    text = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini extraction error:', err.message);
    throw new Error('Failed to extract data from image.');
  }
}

module.exports = { getBunkSuggestion, chat, extractFromImage };
