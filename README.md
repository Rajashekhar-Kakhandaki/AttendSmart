# BunkSmart 🎓

> AI-powered attendance planner and analytics dashboard for college students. Bunk smarter, not harder.

BunkSmart is a modern web application designed to take the stress out of college attendance. It automatically tracks your classes, handles holidays and exams, calculates exact decimal percentages, and uses Google's Gemini AI to tell you exactly when it's safe to take a day off.

## ✨ Core Features

- **Default-Present Tracking** — All timetabled classes are auto-populated as Present. You only need to tap to mark a class as Absent.
- **Precision Analytics** — Calculates exact decimal percentages (e.g., `68.88%`) factoring in prior attendance if you started using the app mid-semester.
- **Smart Dashboard** — Visual segmented progress bars showing total classes held, attended, and absent across all subjects.
- **AI Bunk Planner & Chatbot** — Powered by Google Gemini 2.5 Flash. Log your mood to get personalized, context-aware suggestions on which classes are safe to skip, or chat with the AI directly. Includes robust quota handling and model fallbacks.
- **Interactive Academic Calendar** — Full month-grid view to log and color-code Holidays, Exams, Semester Start/End, Assignments, and College Events. These days are automatically excluded from attendance tracking.
- **What-If Simulator** — Test scenarios like "What happens if I bunk 3 Physics classes next week?" before committing.
- **Weekly Trend Tracking** — Visual line charts tracking your attendance percentage week-by-week.
- **Data Portability** — Export your full attendance history directly to a CSV file.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, Lucide Icons |
| **State & API**| Zustand, React Query, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL, Prisma ORM |
| **AI Engine** | Google Gemini 2.5 Flash (via `@google/generative-ai`) |
| **Data Viz** | Recharts |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL running locally (or a cloud provider like PlanetScale)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd bunksmart
npm run install:all
```

### 2. Set up environment variables

Copy the example env file in the server directory:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your credentials:
```env
PORT=5000
NODE_ENV=development

DATABASE_URL="mysql://username:password@localhost:3306/bunksmart"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

GEMINI_API_KEY="your_gemini_api_key_here"
CLIENT_URL="http://localhost:5173"
```

### 3. Initialize Database

Create your database in MySQL, then push the Prisma schema and run migrations:
```bash
cd server
npx prisma db push
npx prisma generate
```

### 4. Start Development Servers

From the root directory, run both frontend and backend concurrently:
```bash
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
```

---

## 📂 Project Structure

```text
bunksmart/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/           # Dashboard, Today, BunkPlanner, Calendar, History, Analytics, Setup
│       ├── components/      # Layout, UI helpers, Modals, Simulators
│       ├── api/             # Axios client + React Query hooks
│       └── store/           # Zustand auth store
│
├── server/                  # Node.js + Express backend
│   ├── prisma/
│   │   └── schema.prisma    # DB schema definitions
│   └── src/
│       ├── routes/          # auth, timetable, attendance, bunk, export
│       ├── middleware/      # JWT auth, Zod validation
│       └── services/        # Prisma client, Gemini AI wrapper, Bunk math logic
│
└── package.json             # Root runner (concurrently)
```

---

## 🚦 User Flow

1. **Register** → Create an account and set your global minimum attendance threshold (default 75%).
2. **Setup** → Add your subjects (including mid-semester prior attendance offsets) and configure your weekly timetable.
3. **Calendar** → Add your college's holidays, exams, and events to the Academic Calendar so the app knows when classes aren't running.
4. **Today View** → Open the app daily. Classes run exactly as per your timetable. Tap to mark as Absent or Late if needed.
5. **Dashboard & Analytics** → Monitor per-subject safety buffers, weekly trends, and overall attendance breakdowns.
6. **Bunk Planner** → Consult the AI or use the What-If simulator to plan your week without dropping below your threshold.

---

## 🔒 License

MIT License
