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
│   ├── data/             # H2 file database (gitignored, created on first run)
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

Data is stored in an **H2 file database** at `backend/data/` and survives restarts.
The database is seeded with demo users/doctors on first boot. To reset everything,
stop the backend and delete the `backend/data/` folder.

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

### End-to-End (Playwright)

```bash
cd frontend
npm run e2e
```

Starts the backend (port 3001) and frontend dev server (port 3000) automatically via Playwright's `webServer`, then runs the specs in `frontend/e2e/` (login for all three roles, appointment booking, messaging, lab report upload). Uses the locally installed Chrome/Edge-channel Chrome — no browser download needed. Servers already running on those ports are reused outside CI.

## API Endpoints

GET/POST/PUT/DELETE on resources use the H2 **file** database (`backend/data/`), so created doctors, appointments, queue updates etc. persist across restarts.

### Core / AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (returns status, timestamp, hasGeminiKey) |
| POST | `/api/gemini/health-assistant` | AI health assistant (message + chat history + optional report context) |
| POST | `/api/gemini/clinical-notes` | AI SOAP clinical notes generator |

AI calls are hardened: 5s connect / 30s read timeouts, API key sent via the `x-goog-api-key` header (never in the URL or logs), prompt-injection guardrails in the system instructions, and graceful degradation — if the Gemini key is missing or the upstream call fails, the endpoints return HTTP 200 with `isFallback: true` and a canned response instead of a 500.

### Authentication (JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email + password → `{ token, user }` (401 on bad credentials) |
| POST | `/api/auth/register` | Create a **patient** account `{ name, email, password }` → `{ token, user }` (doctor/admin roles are rejected; admins create staff accounts via `/api/users`) |
| GET | `/api/auth/me` | Current user from `Authorization: Bearer <token>` header |

All other `/api/**` endpoints require a valid JWT. Role rules:
- `DELETE /api/**` → ADMIN only
- `/api/users` GET/POST → ADMIN only
- `GET /api/patients` → DOCTOR or ADMIN
- `/api/prescriptions` POST/PUT, `/api/patient-queue` GET/POST/PUT, `/api/doctors` POST/PUT → DOCTOR or ADMIN
- `POST /api/prescriptions/{id}/refill` → any authenticated user (owner checked in service)
- everything else → any authenticated user

**Ownership rules:** patients only ever see their own records — `GET /api/lab-reports`, `/api/prescriptions`, and `/api/appointments` are automatically scoped to the caller (a `patientId` query parameter from a patient is ignored), get-by-id on someone else's record returns 404, and creating a report/appointment for another patient returns 400. Doctors and admins read clinical data broadly. Doctor availability is owned: `PUT /api/doctors/{id}` allows an admin to edit any profile, but a doctor only the profile whose `email` matches their account (anyone else gets 403).

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

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List registered patients for the directory (DOCTOR or ADMIN; passwords never serialized) |

### Doctors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List doctors; `?q=` name search, `?specialty=` filter |
| POST | `/api/doctors` | Create doctor (`slotsJson` = JSON of morning/afternoon/evening slots, max 2000 chars; name + specialty required; `email` links the profile to the doctor's login) |
| GET | `/api/doctors/{id}` | Get doctor by id |
| PUT | `/api/doctors/{id}` | Update doctor / availability — ADMIN for any profile, DOCTOR only for the profile matching their email (403 otherwise, 400 if `slotsJson` > 2000 chars) |
| DELETE | `/api/doctors/{id}` | Delete doctor (204) |

Doctors manage their published time slots from **Settings → My Availability** in the doctor workspace (chips per morning/afternoon/evening period); patients see the updated slots and `nextAvailable` when booking.

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments; `?patientId=` or `?doctorId=` filter |
| POST | `/api/appointments` | Create appointment (status must be `Pending` or `Confirmed`, defaults to `Pending`) |
| GET | `/api/appointments/{id}` | Get appointment by id |
| PUT | `/api/appointments/{id}` | Update appointment; status changes are validated (see workflow below) |
| DELETE | `/api/appointments/{id}` | Delete appointment (204) |

**Appointment status workflow:** `Pending → Confirmed → In Progress → Completed`; `Cancelled` is allowed from `Pending` or `Confirmed`. Terminal states (`Completed`, `Cancelled`) cannot be left. Unknown statuses and invalid transitions return 400. Only doctors/admins can confirm, start, or complete; a patient can cancel their own appointment.

### Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prescriptions` | List prescriptions; `?patientId=` filter |
| POST | `/api/prescriptions` | Create prescription (status must be `Active`, `Refill Requested`, or `Expired`; defaults to `Active`) |
| GET | `/api/prescriptions/{id}` | Get prescription by id |
| POST | `/api/prescriptions/{id}/refill` | Patient requests a refill on their own active prescription → `Refill Requested` |
| PUT | `/api/prescriptions/{id}` | Update prescription (doctor/admin); status validated (see workflow below) |
| DELETE | `/api/prescriptions/{id}` | Delete prescription (204) |

**Prescription refill workflow:** patient requests a refill (`Active → Refill Requested`, requires refills remaining). A doctor approves it via `PUT { "status": "Active" }`, which decrements `refillsRemaining`. Either side can move a prescription to `Expired` from `Active`/`Refill Requested`.

### Lab Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab-reports` | List lab reports; `?patientId=` filter |
| POST | `/api/lab-reports` | Create report metadata only (`valuesJson`, `aiSummaryJson` = JSON strings) |
| POST | `/api/lab-reports/upload` | **Multipart upload** `file` + metadata (`name`, `category`, `date`, `doctorName`, `status`, `valuesJson`, `aiSummaryJson`, optional `patientId`) → report with real `fileSize`, `fileName`, `downloadUrl` |
| GET | `/api/lab-reports/{id}` | Get report by id |
| GET | `/api/lab-reports/{id}/file` | Download the stored file (patients: own reports only; doctors/admins: any) |
| DELETE | `/api/lab-reports/{id}` | Delete report **and its stored file** (204, admin) |

**File storage:** uploads are saved to `backend/data/uploads/` (gitignored; inside the `meditru-data` Docker volume). Allowed types: `pdf`, `png`, `jpg`, `jpeg`; max size 25 MB. Reports created without a file (seeded/demo) return 404 on the file endpoint — the UI falls back to a generated `.txt` record.

### Patient Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patient-queue` | List queue items; `?doctorId=` filter |
| POST | `/api/patient-queue` | Add patient to queue |
| GET | `/api/patient-queue/{id}` | Get queue item by id |
| PUT | `/api/patient-queue/{id}` | Update queue item (status must be `Waiting`, `In Progress`, or `Done`) |
| DELETE | `/api/patient-queue/{id}` | Remove from queue (204) |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/threads` | Threads for the signed-in user (admins see all), newest activity first; includes messages and per-viewer `unread` count |
| GET | `/api/messages/threads/{id}` | Get one thread with messages; marks it read for the participant |
| POST | `/api/messages/threads` | Start a conversation `{ partnerName, partnerRoleLabel?, partnerAvatar?, subject? }`; reuses the existing thread with that partner if there is one |
| POST | `/api/messages/threads/{id}/messages` | Send a message `{ text }` (max 2000 chars) |

**Visibility:** a thread is visible to its two participants and to admins (oversight). Non-participants get 400 on read/send. `partnerName` is matched against registered users first (linking real accounts); unknown names become external participants (e.g. demo clinical staff). Unread counts reset when a participant opens the thread.

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
- E2E: Playwright suite against a freshly started backend + frontend (report uploaded on failure)
