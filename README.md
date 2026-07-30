# NIT Goa — Hostel Room Allotment Undertaking System

A full-stack MERN application that digitizes the NIT Goa "Undertaking for Room Allotment" form. Students and parents authenticate via dual-phone OTP, fill out the declaration form, and the system generates a pixel-accurate PDF matching the original paper form — complete with both signatures. Corrections create new versions rather than overwriting, and admins get a dashboard to review every submission and its full history.

---

## Features

- **Dual-email OTP authentication** — both student and parent emails are independently verified via OTP before login succeeds
- **Automatic new-joinee / returning-user routing** — no manual "new or old" choice; the backend decides based on existing records
- **Digital form with signature upload** — both student and parent signatures required
- **Pixel-accurate PDF generation** — recreates the original form's exact layout, header, tables, and declaration text, with signatures embedded (dark/photo backgrounds are automatically cleaned)
- **Versioning** — one submission per student phone; every correction creates a new version (`original` → `update1` → `update2` ...) instead of overwriting, with full history preserved
- **Email recovery** — if an email changes, verify via whichever address (student or parent) still works, then update and re-verify the new one
- **Admin dashboard** — separate username/password login; view, filter (name/email/roll number/branch/semester), and download any version's PDF
- **Mobile numbers on form** — student and parent mobile numbers are collected on the undertaking form for the generated PDF

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), Upstash Redis (OTP storage + rate limiting), JWT, Multer, pdf-lib, sharp, bcryptjs, nodemailer

**Frontend:** React (Vite), React Router, Tailwind CSS + daisyUI, Axios, react-hot-toast

---

## Project Structure

```
FromEase/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB + Upstash Redis connections
│   │   ├── controller/      # Route handlers (auth, submissions, admin, recovery)
│   │   ├── middleware/      # JWT auth guards, file upload handling
│   │   ├── models/          # Mongoose schemas (Submission, Admin)
│   │   ├── routes/          # Express route definitions
│   │   ├── utils/           # PDF generation, email OTP, text utils
│   │   ├── assets/          # Logo used in generated PDFs
│   │   └── server.js
│   ├── uploads/              # Generated PDFs (gitignored — created at runtime)
│   └── .env                  # Environment variables (gitignored — see below)
│
└── frontend/
    ├── src/
    │   ├── pages/            # LoginPage, FormPage, SubmissionPage, RecoveryPage,
    │   │                      # AdminLoginPage, AdminDashboardPage
    │   ├── components/       # Navbar, Seal (version badge)
    │   └── utils/             # api.js (student), adminApi.js (admin)
    └── index.html
```

---

## Setup

### Prerequisites
- Node.js (v18+)
- A MongoDB Atlas cluster (or local MongoDB)
- An Upstash Redis database (free tier is fine)

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd FromEase
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:
```
MONGO_URI=your_mongodb_connection_string
PORT=5001
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
JWT_SECRET=a_long_random_secret_string

# Optional — for real email delivery (OTPs print to the backend terminal if omitted)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@example.com
```

> **Ask a teammate for the real values** — these are never committed to git for security reasons.

Create the first admin account (one-time script):
```bash
node src/scripts/createAdmin.js
```

Run the backend:
```bash
npm run dev
```
Server starts on `http://localhost:5001`.

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`.

---

## Usage

- **Student login:** `http://localhost:5173/` — enter both email addresses, verify OTP (during development, OTPs print to the backend terminal if SMTP is not configured)
- **Admin login:** `http://localhost:5173/admin` — use the credentials created by `createAdmin.js`
- **Email recovery:** `http://localhost:5173/recovery` — for when a student's or parent's email address has changed

---

## Notes for Contributors

- Never commit `.env`, `node_modules`, or the `backend/uploads/` folder — all are gitignored
- The PDF generator (`backend/src/utils/pdfGenerator.js`) recreates the form entirely in code (no external template file) — coordinates are tuned to match the original scanned form
- OTP emails are sent via nodemailer when SMTP env vars are set; otherwise they are logged to the backend console (`utils/emailUtils.js`)
- All form text is stored and rendered in uppercase automatically (`utils/textUtils.js`)
