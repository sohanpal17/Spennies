# 🪙 Spennies

> **AI-Powered Financial Companion for Gig Workers & Freelancers**  
> Spennies helps gig workers, delivery riders, drivers, and freelancers navigate unpredictable incomes with safe daily spending limits, automated SMS expense tracking, conversational AI logging, and informal loan management.

---

## 📋 Table of Contents
- [✨ Key Features](#-key-features)
- [🏗️ Architecture & Tech Stack](#️-architecture--tech-stack)
- [📂 Project Structure](#-project-structure)
- [📦 Files Needed When Cloning on Another Device](#-files-needed-when-cloning-on-another-device)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Quickstart & Setup Guide](#-quickstart--setup-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Database Setup](#2-database-setup)
  - [3. Backend Setup (FastAPI)](#3-backend-setup-fastapi)
  - [4. Frontend Setup (React + Vite)](#4-frontend-setup-react--vite)
- [🔑 Environment Variables Reference](#-environment-variables-reference)
  - [Backend `.env`](#backend-env)
  - [Backend Firebase Service Account](#backend-firebase-service-account)
  - [Frontend `.env.local`](#frontend-envlocal)
- [📡 API Endpoints Overview](#-api-endpoints-overview)
- [🛠️ Troubleshooting & FAQ](#️-troubleshooting--faq)

---

## ✨ Key Features

- 🛡️ **Safe Daily Spending Limit**: Dynamically calculates how much money you can safely spend today based on variable monthly income, fixed recurring expenses, and your savings targets.
- 🤖 **AI Financial Assistant (Gemini 2.0)**:
  - Natural-language transaction logging (e.g., *"Spent 50 on chai"*, *"Add 500 income"*, *"Borrowed 2000 from Ramesh"*).
  - Automatically detects transaction intents, creates records, or categorizes them in real time.
  - Context-aware financial coaching tailored to your preferred persona and tone.
- 📱 **SMS Transaction Parser**: Paste or ingest bank and UPI transactional alert messages. Extracts merchant, amount, transaction type (debit/credit), and auto-records expenses.
- 🤝 **Informal Loan & Peer Lending Tracker**: Track borrowed and lent money with peers, set due dates, calculate interest, and send reminders.
- 📊 **Visual Analytics & Category Budgets**: Compare real spending vs monthly estimates with interactive charts powered by Recharts.
- 🌐 **Multilingual Support**: Built-in internationalization (i18n) designed for diverse regional gig workers.

---

## 🏗️ Architecture & Tech Stack

```mermaid
flowchart LR
    A["Frontend (React 18 + Vite)"] -->|"REST API + Bearer ID Token"| B["Backend (FastAPI)"]
    A -->|"Auth (Google / Email)"| C["Firebase Authentication"]
    B -->|"Token Verification"| C
    B -->|"ORM (SQLAlchemy 2.0)"| D["PostgreSQL Database"]
    B -->|"NLP & Insights"| E["Google Gemini AI"]
```

- **Frontend**:
  - React 18 with Vite
  - Tailwind CSS for styling
  - Lucide React for UI iconography
  - Recharts for financial data visualizations
  - Zustand for client state management
  - Firebase Web SDK (Auth & Messaging)
  - Axios with automated token injection & refresh interceptors
  - i18next for multi-language support

- **Backend**:
  - FastAPI (Python 3.10+) & Uvicorn
  - PostgreSQL with SQLAlchemy 2.0 & Psycopg2
  - Firebase Admin SDK (Authentication token verification)
  - Google Generative AI SDK (`google-generativeai`)
  - Pydantic v2 & Pydantic-Settings for configuration and schemas
  - PyFCM for push notifications

---

## 📂 Project Structure

```text
Spennies/
├── backend/
│   ├── app/
│   │   ├── database/       # Database session, base class, init_db script
│   │   ├── middleware/     # Firebase Bearer token authentication middleware
│   │   ├── models/         # SQLAlchemy models (User, Transaction, Loan, Estimate, AIInsight)
│   │   ├── routes/         # API Routers (auth, users, transactions, estimates, loans, dashboard, ai)
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # AI service (Gemini client, chatbot, categorizer, sms_parser)
│   │   ├── config.py       # Pydantic Settings reading .env
│   │   └── main.py         # FastAPI application entrypoint & CORS config
│   ├── firebase/           # Holds serviceAccountKey.json (ignored by Git)
│   │   └── .gitkeep
│   ├── tests/
│   ├── .env.example        # Template for backend environment variables
│   ├── .env                # Actual backend environment file (CREATE MANUALLY)
│   └── requirements.txt    # Python dependencies
├── spennies-frontend/
│   ├── public/             # Static web assets
│   ├── src/
│   │   ├── components/     # UI components (ChatBot, AddTransactionModal, SafeDailyBudget, etc.)
│   │   ├── config/         # Firebase Client configuration
│   │   ├── context/        # React Auth Context (Firebase + Backend sync)
│   │   ├── pages/          # Application views (Landing, Auth, Dashboard, Transactions)
│   │   ├── services/       # Axios API client & Firebase Auth helpers
│   │   ├── App.jsx         # App router and protected route definition
│   │   └── main.jsx        # React root entry
│   ├── .env.example        # Template for frontend environment variables
│   ├── .env.local          # Actual frontend environment file (CREATE MANUALLY)
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.js      # Vite build configuration
├── .gitignore              # Repository gitignore rules
└── README.md
```

---

## 📦 Files Needed When Cloning on Another Device

When you `git clone` this repository on a fresh machine, the following files are **intentionally ignored by Git** for security reasons and **must be created manually**:

| # | File Path | Why It Is Needed | How To Create |
|---|-----------|------------------|---------------|
| 1 | **`backend/.env`** | Contains backend credentials, database URL, Gemini AI key, and CORS settings | Copy `backend/.env.example` to `backend/.env` and fill in your values |
| 2 | **`backend/firebase/serviceAccountKey.json`** | Private credentials for Firebase Admin SDK to verify user JWT tokens on the backend | Download from Firebase Console (Project Settings ➔ Service accounts ➔ Generate new private key) |
| 3 | **`spennies-frontend/.env.local`** | Frontend environment variables (Backend API URL & Firebase Web Client credentials) | Copy `spennies-frontend/.env.example` to `spennies-frontend/.env.local` and fill in Firebase Web credentials |

> [!WARNING]
> Never commit `backend/.env`, `serviceAccountKey.json`, or `spennies-frontend/.env.local` to Git. They contain sensitive secrets and API keys.

---

## ⚙️ Prerequisites

Make sure the following software is installed on the destination device:

1. **Python 3.10, 3.11, or 3.12**
   - Check version: `python --version`
2. **Node.js (v18 or later) & npm**
   - Check version: `node -v` and `npm -v`
3. **PostgreSQL Database**
   - Local installation (PostgreSQL 14+ / pgAdmin) **OR**
   - Cloud PostgreSQL provider (Supabase, Neon, Railway, AWS RDS, etc.)
4. **Firebase Project**
   - Authentication enabled (Google & Email/Password providers)
   - Web App registered (for frontend config)
   - Service account private key generated (for backend verification)
5. **Google AI Studio (Gemini) API Key**
   - Get a free key at [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Quickstart & Setup Guide

### 1. Clone Repository

```bash
git clone https://github.com/your-username/Spennies.git
cd Spennies
```

---

### 2. Database Setup

Create a PostgreSQL database for the project:

```sql
-- Run inside PostgreSQL CLI (psql) or pgAdmin:
CREATE DATABASE spennies_db;
```
If using a custom user:
```sql
CREATE USER spennies_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE spennies_db TO spennies_user;
```

---

### 3. Backend Setup (FastAPI)

#### A. Navigate to backend directory
```bash
cd backend
```

#### B. Create and activate a Python virtual environment
- **On Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **On Windows (Command Prompt):**
  ```cmd
  python -m venv venv
  venv\Scripts\activate.bat
  ```
- **On macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

#### C. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### D. Create `backend/.env`
Copy the example file:
```bash
# Windows PowerShell:
Copy-Item .env.example .env

# macOS / Linux / Git Bash:
cp .env.example .env
```
Edit `backend/.env` with your real credentials:
```env
# Database (Replace with your PostgreSQL credentials)
DATABASE_URL=postgresql://spennies_user:your_password@localhost:5432/spennies_db

# Firebase Admin Service Account path
FIREBASE_CREDENTIALS_PATH=./firebase/serviceAccountKey.json

# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here

# FCM (Optional)
FCM_SERVER_KEY=your_fcm_server_key_here

# Security
SECRET_KEY=your_secret_key_for_jwt_change_this_in_production
ALGORITHM=HS256

# App Config
ENVIRONMENT=development
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
```

#### E. Add Firebase Admin Key
1. Go to [Firebase Console](https://console.firebase.google.com/) ➔ Select your project.
2. Go to **Project Settings** (gear icon) ➔ **Service accounts**.
3. Click **Generate new private key** and confirm.
4. Rename the downloaded file to `serviceAccountKey.json`.
5. Place it into the `backend/firebase/` folder:
   ```text
   backend/firebase/serviceAccountKey.json
   ```

#### F. Initialize database tables
The FastAPI server creates tables automatically on start, or you can run the initialization script directly:
```bash
python -m app.database.init_db
```
*(You should see: `✅ Database tables created successfully!`)*

#### G. Run the backend development server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

---

### 4. Frontend Setup (React + Vite)

Open a **new terminal tab/window**:

#### A. Navigate to frontend directory
```bash
cd spennies-frontend
```

#### B. Create `spennies-frontend/.env.local`
Copy the example file:
```bash
# Windows PowerShell:
Copy-Item .env.example .env.local

# macOS / Linux / Git Bash:
cp .env.example .env.local
```
Fill in your Firebase Web App credentials (from Firebase Console ➔ Project Settings ➔ General ➔ Your apps ➔ Web app):
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

#### C. Install dependencies
```bash
npm install
```

#### D. Start the Vite development server
```bash
npm run dev
```
Open your browser at:
```text
http://localhost:5173
```

---

## 🔑 Environment Variables Reference

### Backend `.env`

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `DATABASE_URL` | **Yes** | SQLAlchemy PostgreSQL connection URI | `postgresql://user:password@localhost:5432/spennies_db` |
| `FIREBASE_CREDENTIALS_PATH` | **Yes** | Relative path to Firebase Admin SDK JSON | `./firebase/serviceAccountKey.json` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API Key for NLP & Insights | `AIzaSy...` |
| `FCM_SERVER_KEY` | No | Firebase Cloud Messaging server key | `your_fcm_key` |
| `SECRET_KEY` | **Yes** | JWT signing key | Random 32+ character string |
| `ALGORITHM` | No | JWT hashing algorithm (defaults to `HS256`) | `HS256` |
| `ENVIRONMENT` | No | Runtime environment (`development` / `production`) | `development` |
| `DEBUG` | No | Enable verbose debug logging | `True` |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed CORS origins | `http://localhost:5173,http://localhost:3000` |

### Backend Firebase Service Account

- **Location**: `backend/firebase/serviceAccountKey.json`
- **Format**: JSON file containing `type`, `project_id`, `private_key_id`, `private_key`, `client_email`, `client_id`, etc.
- **Source**: Firebase Console ➔ Project Settings ➔ Service accounts ➔ Generate new private key.

### Frontend `.env.local`

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_URL` | **Yes** | URL pointing to running FastAPI backend (`http://localhost:8000`) |
| `VITE_FIREBASE_API_KEY` | **Yes** | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | Firebase authentication domain (`<project-id>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | Firebase project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Yes** | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | Firebase sender ID for Cloud Messaging |
| `VITE_FIREBASE_APP_ID` | **Yes** | Firebase web app ID (`1:xxxx:web:xxxx`) |

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check (`{"message": "Spennies API is running! 🚀"}`) |
| `POST` | `/api/auth/register` | Register new user profile with baseline income & category estimates |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile |
| `GET` | `/api/dashboard/summary` | Get aggregated income, expenses, and savings metrics |
| `GET` | `/api/transactions/` | List user transactions with filters |
| `POST` | `/api/transactions/` | Create a new manual transaction |
| `DELETE`| `/api/transactions/{id}`| Delete a transaction |
| `GET` | `/api/estimates/` | Get monthly estimated budget per expense category |
| `POST` | `/api/estimates/` | Create or update budget category estimates |
| `GET` | `/api/loans/` | Get all peer loans (borrowed & lent) |
| `POST` | `/api/loans/` | Record a new peer loan with due date & interest |
| `PUT` | `/api/loans/{id}/paid` | Mark a loan as settled/repaid |
| `POST` | `/api/ai/chat` | Send conversational prompt (auto-logs expenses & loans if detected) |
| `POST` | `/api/ai/categorize` | Categorize an expense using Gemini |
| `POST` | `/api/ai/parse-sms` | Extract amount, merchant, and debit/credit status from raw SMS |

---

## 🛠️ Troubleshooting & FAQ

<details>
<summary><b>1. Firebase initialization error or 401 Unauthorized errors</b></summary>

- Ensure `backend/firebase/serviceAccountKey.json` exists and that `FIREBASE_CREDENTIALS_PATH=./firebase/serviceAccountKey.json` is set in `backend/.env`.
- Ensure the Firebase project in the backend matches the project configured in `spennies-frontend/.env.local`.
- Verify that **Email/Password** and **Google** sign-in providers are enabled in your Firebase Console under Authentication ➔ Sign-in method.
</details>

<details>
<summary><b>2. PostgreSQL `OperationalError: could not connect to server`</b></summary>

- Check if your PostgreSQL service is running:
  - Windows: Check the `Services` manager (`services.msc`) for `postgresql-x64-xx`.
  - macOS: `brew services list` or start with `brew services start postgresql`.
  - Linux: `sudo systemctl status postgresql`.
- Confirm `DATABASE_URL` username, password, host, port (`5432`), and database name match what you created.
</details>

<details>
<summary><b>3. Gemini API returns empty or fails</b></summary>

- Verify your `GEMINI_API_KEY` in `backend/.env`. You can test your key directly in Google AI Studio.
- Ensure your quota has not been exceeded.
</details>

<details>
<summary><b>4. Frontend CORS Error (`Access-Control-Allow-Origin`)</b></summary>

- Ensure `ALLOWED_ORIGINS` in `backend/.env` includes `http://localhost:5173` (the default Vite dev port).
- By default in development, `app/config.py` allows all origins `["*"]`.
</details>
