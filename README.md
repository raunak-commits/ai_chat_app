# MyChat AI

A full-stack AI-powered chat application with user authentication and persistent chat history.

## Live Demo
[ai-chat-app-kappa-beryl.vercel.app](https://ai-chat-app-kappa-beryl.vercel.app)

## Features
- User authentication (Register/Login) with JWT
- Passwords hashed with bcrypt
- AI responses powered by Groq (Llama 3.3 70B)
- Persistent chat history per user stored in PostgreSQL
- Multiple chat sessions with sidebar toggle
- Clean dark UI with typing indicators

## Tech Stack
- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **AI:** Groq API (Llama 3.3 70B)
- **Auth:** JWT + bcrypt
- **Deployment:** Vercel (frontend) + Railway (backend + database)

## Architecture
- Decoupled frontend and backend via REST API
- JWT-based stateless authentication
- Per-user chat isolation in PostgreSQL
- Container-ready backend (Docker-compatible)
- Auto-deploys via GitHub → Vercel/Railway CI/CD pipeline

## Running Locally

### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create a `.env` file in the backend folder:
```
GROQ_API_KEY=your-groq-api-key
JWT_SECRET=your-jwt-secret
DATABASE_URL=your-postgresql-url
PORT=5000
```