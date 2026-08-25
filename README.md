# MediTru — Modern Healthcare Management Platform

MediTru is a full-stack web application for managing healthcare workflows. It provides separate **Patient**, **Doctor**, and **Admin** workspaces with appointment booking, medical records, prescriptions, an AI Health Assistant, and AI-generated clinical notes (SOAP) for doctors.

- **Frontend:** React 19 + Vite + Tailwind CSS (`frontend/`)
- **Backend:** Node.js + Express + Google Gemini API (`backend/`)

## Project Structure

```
MediTru/
├── backend/    # Express API server (port 3001)
│   ├── server.ts
│   ├── .env          # GEMINI_API_KEY lives here
│   └── package.json
└── frontend/   # React + Vite app (port 3000)
    ├── src/
    ├── index.html
    └── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

## Setup

### 1. Backend

```bash
cd backend
npm install
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

Open **two terminals**:

**Terminal 1 — Backend (port 3001):**

```bash
cd backend
npm run start:dev
```

**Terminal 2 — Frontend (port 3000):**

```bash
cd frontend
npm run dev
```

Then open **http://localhost:3000**

## Role-Based URLs

| URL       | Page                    |
| --------- | ----------------------- |
| `/`       | Patient sign-in (default) |
| `/patient` | Patient portal sign-in |
| `/doctor`  | Doctor portal sign-in   |
| `/admin`   | Admin console sign-in   |



