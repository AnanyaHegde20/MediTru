# MediTru — Modern Healthcare Management Platform

MediTru is a full-stack web application for managing healthcare workflows. It provides separate **Patient**, **Doctor**, and **Admin** workspaces with appointment booking, medical records, prescriptions, an AI Health Assistant, and AI-generated clinical notes (SOAP) for doctors.

- **Frontend:** React 19 + Vite + Tailwind CSS (`frontend/`)
- **Backend:** Java 17 + Spring Boot 3.4 + Google Gemini API (`backend/`)

## Project Structure

```
MediTru/
├── backend/    # Spring Boot API server (port 3001)
│   ├── pom.xml
│   ├── Dockerfile
│   ├── .env              # GEMINI_API_KEY lives here
│   └── src/main/java/com/meditru/
│       ├── MediTruApplication.java
│       ├── controller/   # REST controllers
│       ├── service/      # Gemini API service
│       ├── filter/       # Rate limiting, security headers, logging
│       ├── config/       # CORS, properties
│       └── dto/          # Request/response records
├── frontend/   # React + Vite app (port 3000)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   └── package.json
└── docker-compose.yml
```

## Prerequisites

- [Java 17+](https://adoptium.net/) (JDK)
- [Apache Maven 3.8+](https://maven.apache.org/)
- [Node.js](https://nodejs.org/) (v18 or later)

## Setup

### 1. Backend

```bash
cd backend
mvn compile
```

### 2. Frontend

```bash
cd frontend
npm install
```

## API Key Configuration

The backend uses the **Google Gemini API**. Add your key to `backend/.env`:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

Get a free key from [Google AI Studio](https://aistudio.google.com/apikey).

> If no key is set, the AI endpoints return fallback responses so the app still works.

## Running the App

### Option A: Manual

Open **two terminals**:

**Terminal 1 — Backend (port 3001):**

```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 — Frontend (port 3000):**

```bash
cd frontend
npm run dev
```

Then open **http://localhost:3000**

### Option B: Docker Compose

```bash
docker-compose up --build
```

## Running Tests

### Backend

```bash
cd backend
mvn test
```

### Frontend

```bash
cd frontend
npx vitest run
```

### Type Check

```bash
cd frontend
npx tsc --noEmit
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (returns status, timestamp, hasGeminiKey) |
| POST | `/api/gemini/health-assistant` | AI health assistant (message + chat history) |
| POST | `/api/gemini/clinical-notes` | AI SOAP clinical notes generator |

### Example Request — Health Assistant

```json
POST /api/gemini/health-assistant
{
  "message": "What are symptoms of flu?",
  "history": [],
  "reportContext": null
}
```

### Example Request — Clinical Notes

```json
POST /api/gemini/clinical-notes
{
  "patientName": "John Doe",
  "age": 35,
  "symptoms": "fever, cough for 3 days",
  "vitals": "Temp 101F, BP 120/80",
  "consultationTranscript": "Patient reports persistent cough"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | (empty) | Google Gemini API key |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins |

## Role-Based URLs

| URL | Page |
|-----|------|
| `/login` | Login page |
| `/patient/*` | Patient portal |
| `/doctor/*` | Doctor portal |
| `/admin/*` | Admin console |

## CI/CD

GitHub Actions runs automatically on every push/PR to `main`:
- Backend: compile + test (Java 17, Maven)
- Frontend: install + typecheck + test + build (Node 20)
