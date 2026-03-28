# Automated Medicine Dispensing and Vending System

Full-stack web app with IoT simulation for medicine dispensing workflows.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + Recharts + i18n
- Backend: Node.js + Express.js + Socket.IO
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt
- Realtime: WebSockets (Socket.IO)

## Folder Structure

- `client/` React frontend
- `server/` Express backend
- `server/src/models/` MongoDB models
- `server/src/routes/` REST routes
- `server/src/controllers/` route handlers
- `server/src/middleware/` auth and role guards
- `server/src/services/` scheduler and logging

## Core Features Implemented

1. JWT signup/login with role-based auth (patient/doctor/admin)
2. Patient dashboard
   - Prescriptions, schedule, history
   - Dose status: taken/missed/pending
   - RFID verification simulation
   - Voice reminder trigger simulation
   - Missed-dose risk prediction (heuristic)
3. Doctor dashboard
   - Add prescriptions
   - Monitor adherence analytics
4. Admin dashboard
   - Machine lock/unlock
   - Medicine inventory CRUD and dispensing trigger
   - Mock payment (UPI/card)
   - Audit logs
5. IoT simulation APIs
   - Temperature updates
   - Stock updates
   - Dispense motor trigger
   - Pill drop sensor simulation
   - RFID check simulation
6. Automated dispensing logic
   - Minute-level scheduler for due doses
   - Missed-dose marking after 30 minutes
   - Buzzer/voice reminder event simulation
7. Multi-language support
   - English, Hindi, Marathi
8. Alerts
   - Low stock
   - Expiry alert
   - Missed dose notifications
9. Realtime updates using Socket.IO

## Database Models

- User
- Medicine
- Prescription
- Machine
- Log
- Notification
- DoseEvent
- Payment

## Setup

### 1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and backend at `http://localhost:5000`.

## Firebase Push Notifications (FCM)

### Frontend (Web FCM)

Add these to `client/.env`:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

The app will:

1. Request browser notification permission.
2. Fetch FCM token with VAPID key.
3. Save token to backend via `POST /api/save-token`.
4. Handle foreground notifications using Firebase `onMessage`.

### Backend (Firebase Admin SDK)

Option 1: File path configuration

1. Copy `server/firebase-service-account.example.json` to `server/firebase-service-account.json`.
2. Paste your Firebase service account credentials into it.
3. Add to `server/.env`:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

## Push Notification APIs

- `POST /api/save-token` (auth required): Save caller's FCM token
- `POST /api/notifications/save-token` (auth required): Same behavior via notifications route
- `POST /api/notifications/push` (admin/doctor): Send push to one token
- `POST /api/notifications/push/user` (admin/doctor): Send push to all tokens stored for one user

Example body for single-token push:

```json
{
   "token": "fcm-device-token",
   "title": "Dose Reminder",
   "body": "It is time to take your medicine"
}
```

Example body for user-targeted push:

```json
{
   "userId": "<mongodb-user-id>",
   "title": "Dose Reminder",
   "body": "Please take your 9 PM dose"
}
```

## Seed Data

1. Register an admin account using `/signup` with role `admin`.
2. Login and copy JWT token.
3. Call `POST /api/seed` with `Authorization: Bearer <token>`.

Seed credentials created:

- `admin@medivend.com / Admin@123`
- `doctor@medivend.com / Doctor@123`
- `patient@medivend.com / Patient@123`

## Important API Groups

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

- `GET /api/medicines`
- `POST /api/medicines`
- `PUT /api/medicines/:id`
- `DELETE /api/medicines/:id`
- `GET /api/medicines/alerts/inventory`

- `GET /api/prescriptions`
- `POST /api/prescriptions`
- `PUT /api/prescriptions/:id`
- `GET /api/prescriptions/analytics/adherence?patientId=<id>`

- `GET /api/patient/dashboard`
- `POST /api/patient/dose/taken`
- `POST /api/patient/voice-reminder`

- `POST /api/iot/temperature`
- `POST /api/iot/stock`
- `POST /api/iot/dispense`
- `POST /api/iot/pill-drop`
- `POST /api/iot/rfid-check`

- `GET /api/admin/machine`
- `POST /api/admin/machine/lock`
- `POST /api/admin/payment/mock`

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

## Deployment Notes

### One-Link Full Stack on Render (Recommended)

This repo supports deploying backend + frontend as one Render web service.

1. Push this project to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select your GitHub repo. Render will read `render.yaml`.
4. Add environment variables in Render service settings:

```bash
MONGO_URI=<your MongoDB Atlas URI>
MONGO_DB_NAME=medivend
JWT_SECRET=<strong random secret>
CLIENT_ORIGIN=https://<your-render-service>.onrender.com
LOW_STOCK_THRESHOLD=10
EXPIRY_ALERT_DAYS=30
MAX_TEMP=35
AUTO_SEED_ON_START=true
FIREBASE_SERVICE_ACCOUNT_JSON=<single-line firebase service account JSON>
```

5. Deploy and open:

```text
https://<your-render-service>.onrender.com
```

Use this one URL for the complete app (frontend + backend API).

### Make Sure Data Persists and Shows

- Do **not** leave `MONGO_URI` empty in Render.
- Use MongoDB Atlas network access that allows Render connections.
- With `AUTO_SEED_ON_START=true`, starter users/medicine/prescription are inserted automatically when missing.
- Optional manual fallback: login as admin and run `POST /api/seed`.
- If lists are empty, verify data exists in the same database named by `MONGO_DB_NAME`.

## Known Notes

- Tailwind at-rule warnings may show in editor if Tailwind CSS IntelliSense is not configured, but build works correctly.
- Frontend production bundle is large due to charts and dashboard dependencies; code splitting can be added later.
