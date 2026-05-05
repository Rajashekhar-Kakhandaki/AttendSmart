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
      const isQuota     = msg.includes('429') || msg.includes('quota');

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
  const moodContext  = mood ? `Today's mood: ${mood}.` : 'No mood logged today.';
  const recentMoods  = moodHistory?.length
    ? `Recent mood trend (last 7 days): ${moodHistory.map((m) => m.mood).join(', ')}.`
    : '';

  const subjectSummary = stats
    .map((s) =>
      `${s.subject.name}: ${s.percentage}% attendance (threshold: ${s.threshold}%, safe bunks left: ${s.safeBunks}, must-attend: ${s.subject.isMustAttend})`
    )
    .join('\n');

  const prompt = `You are BunkSmart, a helpful AI assistant for a college student.
Your job is to give a short, friendly, practical bunk suggestion for today or this week.

Student's attendance summary:
${subjectSummary}

${moodContext}
${recentMoods}

Rules you must follow:
- Never suggest bunking a must-attend subject
- Never suggest bunking if it would drop attendance below threshold
- If the student is tired or stressed, suggest safe bunks on low-risk subjects
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

  const systemContext = `You are BunkSmart, a friendly AI attendance advisor for college students.
Current attendance data: ${subjectSummary}
Answer questions about bunking, attendance, and planning. Be concise, friendly, and accurate.
Never recommend unsafe actions. If a bunk is risky, say so clearly.`;

  // Build history — must strictly alternate: user → model → user → model ...
  const rawHistory  = conversationHistory || [];
  const validHistory = [];
  for (let i = 0; i + 1 < rawHistory.length; i += 2) {
    if (rawHistory[i].role === 'user' && rawHistory[i + 1].role === 'model') {
      validHistory.push({ role: 'user',  parts: [{ text: rawHistory[i].content }] });
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

module.exports = { getBunkSuggestion, chat };
