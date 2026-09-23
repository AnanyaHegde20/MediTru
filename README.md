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

### Core / AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (returns status, timestamp, hasGeminiKey) |
| POST | `/api/gemini/health-assistant` | AI health assistant (message + chat history + optional report context) |
| POST | `/api/gemini/clinical-notes` | AI SOAP clinical notes generator |

### Authentication (JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email + password → `{ token, user }` (401 on bad credentials) |
| POST | `/api/auth/register` | Create account `{ name, email, password, role }` → `{ token, user }` |
| GET | `/api/auth/me` | Current user from `Authorization: Bearer <token>` header |

All other `/api/**` endpoints require a valid JWT. Role rules:
- `DELETE /api/**` → ADMIN only
- `/api/users` GET/POST → ADMIN only
- `/api/prescriptions` POST/PUT, `/api/patient-queue` PUT, `/api/doctors` POST/PUT → DOCTOR or ADMIN
- everything else → any authenticated user

**Demo accounts** (password `password`):
- Patient: `priya.sharma@example.com`
- Doctor: `rajesh.kumar@medicare.health`
- Admin: `admin@medicare.health`

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user (400 on duplicate email) |
| GET | `/api/users/{id}` | Get user by id |
| PUT | `/api/users/{id}` | Partial update user |
| DELETE | `/api/users/{id}` | Delete user (204) |
| GET | `/api/users/email/{email}` | Lookup user by email |

### Doctors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List doctors; `?q=` name search, `?specialty=` filter |
| POST | `/api/doctors` | Create doctor (`slotsJson` = JSON of morning/afternoon/evening slots) |
| GET | `/api/doctors/{id}` | Get doctor by id |
| PUT | `/api/doctors/{id}` | Update doctor |
| DELETE | `/api/doctors/{id}` | Delete doctor (204) |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments; `?patientId=` or `?doctorId=` filter |
| POST | `/api/appointments` | Create appointment |
| GET | `/api/appointments/{id}` | Get appointment by id |
| PUT | `/api/appointments/{id}` | Update appointment (status, notes, etc.) |
| DELETE | `/api/appointments/{id}` | Delete appointment (204) |

### Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prescriptions` | List prescriptions; `?patientId=` filter |
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions/{id}` | Get prescription by id |
| PUT | `/api/prescriptions/{id}` | Update prescription |
| DELETE | `/api/prescriptions/{id}` | Delete prescription (204) |

### Lab Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab-reports` | List lab reports; `?patientId=` filter |
| POST | `/api/lab-reports` | Create lab report (`valuesJson`, `aiSummaryJson` = JSON strings) |
| GET | `/api/lab-reports/{id}` | Get lab report by id |
| DELETE | `/api/lab-reports/{id}` | Delete lab report (204) |

### Patient Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patient-queue` | List queue items; `?doctorId=` filter |
| POST | `/api/patient-queue` | Add patient to queue |
| GET | `/api/patient-queue/{id}` | Get queue item by id |
| PUT | `/api/patient-queue/{id}` | Update queue item (status/room/waitTime) |
| DELETE | `/api/patient-queue/{id}` | Remove from queue (204) |

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
| `JWT_SECRET` | dev secret | JWT signing secret (set a long random value in production) |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime in ms (default 24h) |

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
