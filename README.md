# CampusIQ – Early Academic Risk Detection & Student Intervention Platform

**Team Tarkshastra** | TS-12 | Dev IT Limited

---

## 1. Problem Statement

Universities and colleges often identify academically at‑risk students **too late**. Critical indicators such as declining attendance, low internal marks, missed assignments, and irregular LMS activity are **scattered** across multiple systems and manually reviewed. Faculty mentors rely on delayed reports or subjective judgment, resulting in late interventions.

**CampusIQ** solves this by providing a unified, real‑time monitoring platform that continuously analyses academic signals, detects early risk trends, and provides **explainable AI-driven insights** for proactive student support.

---

## 2. Solution Overview

CampusIQ is a full‑stack web platform with **four role‑based portals**:

| Portal | Key Capabilities |
|--------|-----------------|
| **Student** | Dashboard, Risk Analysis with heatmap, Per-subject Attendance with Calendar, Learning Hub, Assignments, Schedule, Grades with marks breakdown, Hall Ticket |
| **Faculty Mentor** | Academic Score Distribution, Student Profiles, Intervention Logging, Remedial Management |
| **Subject Teacher** | Attendance Marking (synced with timetable), Marks Entry (Mid/Internal/IA/EndSem), LMS Content Upload, Assignment Management, Grades |
| **Admin** | User Management, Timetable Configuration, Classroom Management, Hall Ticket Rules, Events |

---

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 (Vite 8), Tailwind CSS v4, Recharts, Axios, React‑Router‑DOM v6, Socket.io Client, Lucide Icons |
| **Backend** | Node.js, Express.js, JWT (httpOnly cookies), bcrypt.js, Multer, Socket.io, node-cron, Nodemailer |
| **Database** | PostgreSQL 13+ |
| **AI/ML** | Custom multi-factor risk engine with SHAP-derived feature weights, Grok LLM integration (optional) |
| **Design** | Google Fonts (DM Sans), modern palette (#1B263B, #415A77, #FFC300), micro-animations |

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  Student │ Mentor │ Teacher │ Admin  ← Role-based routing   │
│  Axios (/api proxy) │ Socket.io (/socket.io proxy)          │
└────────────────────────┬────────────────────────────────────┘
                         │  Vite Dev Proxy (port 5173 → 5000)
┌────────────────────────▼────────────────────────────────────┐
│                  Express.js Backend (port 5000)              │
│  Auth (JWT+Cookie) │ Risk Engine │ LLM Service │ Scheduler  │
│  14 API route modules │ Multer uploads │ Socket.io server   │
│  Static file serving (/uploads)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    PostgreSQL Database                        │
│  16 tables │ Indexes │ UNIQUE constraints │ CHECK constraints│
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema (16 Tables)

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | Authentication — name, email, password_hash, role (student/mentor/teacher/admin), department |
| 2 | `students` | Student profile — roll_no, semester, section, mentor_id |
| 3 | `faculty` | Faculty profile — department, cabin_number, subjects |
| 4 | `subjects` | Course catalog — name, code, teacher_id, semester |
| 5 | `attendance` | Daily attendance — student_id, subject_id, date, status (present/absent). UNIQUE per student+subject+date |
| 6 | `marks` | Internal assessment — mid_marks(/25), internal_marks(/25), ia_marks(/25), endsem_marks(/100). UNIQUE per student+subject |
| 7 | `assignments` | Assignment metadata — title, description, deadline, allow_late, created_by |
| 8 | `submissions` | Student submissions — file_url, status (submitted/pending/late), grade, grade_remarks |
| 9 | `lms_content` | Learning materials — title, file_url, type (pdf/ppt/video/link/docx), uploaded_by |
| 10 | `timetable` | Weekly schedule — subject_id, section, day, start_time, end_time, room_number |
| 11 | `interventions` | Mentor actions — type (counseling/remedial/etc), remarks, llm_suggestion |
| 12 | `events` | Campus events — title, start_date, end_date, description |
| 13 | `hall_ticket_rules` | Eligibility rules — min_attendance_percent, enabled |
| 14 | `notifications` | In-app alerts — user_id, message, is_read |
| 15 | `risk_scores` | Historical risk snapshots — score, level, reasons[], llm_insights, computed_at |
| 16 | `classrooms` | Room management — number, capacity, type (lecture/lab/seminar), building |

---

## 6. Core Features

### 6.1 Multi-Factor Risk Engine
- **Weighted scoring** using ML-derived SHAP feature weights from `Extra/feature_weights.json`:
  - Attendance: **35.82%**
  - Marks: **31.35%**
  - Assignment Completion: **20.89%**
  - LMS Activity: **11.94%**
- Risk levels: **High** (score ≤ 40), **Medium** (41–70), **Low** (71–100)
- Explainable reasons generated per factor

### 6.2 Risk Trend & Heatmap
- Historical risk score snapshots stored weekly in `risk_scores` table
- **Line chart** showing score trend over 6+ weeks
- **Color-coded heatmap** (green → red) for visual weekly risk progression

### 6.3 Student Attendance (Calendar View)
- Per-subject attendance cards with percentage and progress bar
- **Interactive calendar** showing present/absent days color-coded (green/red)
- Month navigation with subject filtering
- Overall attendance summary with hall ticket eligibility warning (< 75%)

### 6.4 Learning Hub (LMS)
- Browse all study materials (PDF, PPT, Video, DOCX)
- **View** files in new tab (opens directly via static file serving)
- **Download** files using fetch+blob for reliable browser downloads
- Filter by type, subject, and search
- Teachers can upload new materials via the Teacher portal

### 6.5 Grades & Marks Breakdown
- **4 summary cards**: Overall Average, Percentage, Subject Count, Top Subject
- **Grouped bar chart** comparing Mid Sem / Internal / IA per subject
- **Grade distribution pie chart**
- Detailed marks table with grade computation (O/A+/A/B/C/P/F)
- Assignment grades section (when available)

### 6.6 Faculty Mentor — Academic Score
- Renamed from "Risk Score" to **"Academic Score"** for positive framing
- Academic Score Distribution (pie chart)
- Student list with Academic Level filtering (Needs Attention / Moderate / On Track)
- Student detail view with performance chart and intervention history

### 6.7 Teacher Attendance Sync
- Subject dropdown populated from teacher's assigned subjects
- Date picker with current-date default
- **Bulk toggle** (All Present / All Absent) with click-to-toggle rows
- Live summary (Present / Absent / Rate %)
- Data saved via UPSERT (`ON CONFLICT DO UPDATE`) — synced with student portal

### 6.8 Teacher Marks Entry
- Subject dropdown populated from `getMySubjects()` → `/faculty/my/subjects`
- Loads **existing marks** when subject is selected
- Exam type tabs: Mid / Internal / IA / EndSem
- CSV upload and export functionality
- Empty-state warning when no subjects assigned

---

## 7. API Routes (14 Modules)

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| Auth | `/api/auth` | `POST /login`, `POST /logout`, `GET /me` |
| Students | `/api/students` | `GET /`, `GET /me`, `GET /:id`, `GET /:id/risk`, `GET /:id/attendance`, `GET /:id/marks`, `GET /:id/assignments`, `GET /:id/hallticket` |
| Attendance | `/api/attendance` | `GET /subject/:subjectId`, `GET /:studentId`, `POST /` (bulk upsert) |
| Marks | `/api/marks` | `PUT /bulk`, `POST /csv-upload`, `GET /export/:subjectId`, `GET /:studentId` |
| Assignments | `/api/assignments` | CRUD + `POST /:id/submit`, `GET /:id/submissions`, `PUT /:id/submissions/:studentId/grade` |
| LMS | `/api/lms` | `GET /`, `POST /upload`, `GET /:subjectId`, `DELETE /:contentId` |
| Interventions | `/api/interventions` | `GET /`, `GET /suggest/:studentId`, `POST /`, `GET /:studentId`, `DELETE /:id` |
| Timetable | `/api/timetable` | CRUD by section |
| Users | `/api/users` | CRUD + CSV import |
| Hall Ticket | `/api/hallticket` | `GET /rules`, `PUT /rules`, `GET /:studentId/eligibility` |
| Events | `/api/events` | CRUD |
| Notifications | `/api/notifications` | `GET /`, `PUT /read-all`, `PUT /:id/read` |
| Faculty | `/api/faculty` | `GET /`, `GET /my/subjects`, `GET /:id` |
| Classrooms | `/api/classrooms` | CRUD |

> All routes use `auth` middleware (JWT cookie verification). Role-specific routes use `roleGuard('role1', 'role2', ...)`.

> **Route ordering**: Static endpoints (e.g., `/my/subjects`, `/read-all`, `/bulk`) are defined **before** dynamic parameter routes (`/:id`) to prevent Express matching conflicts.

---

## 8. Environment Variables

Create `server/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campusiq
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key

# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# Email (optional — for Nodemailer alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Grok LLM API (optional — falls back to rule-based insights)
GROK_API_KEY=
GROK_API_URL=https://api.x.ai/v1/chat/completions
```

---

## 9. Setup & Run

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm

### Step 1: Clone
```bash
git clone <repo-url>
cd Tarkshastra
```

### Step 2: Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### Step 3: Setup Database
```bash
psql -U postgres -c "CREATE DATABASE campusiq;"
cd server
npm run migrate    # Creates 16 tables + indexes
npm run seed       # Seeds realistic data: 35 students, 1 mentor, 3 teachers, 540+ attendance records, etc.
```

### Step 4: Start Backend
```bash
cd server
npm start          # http://localhost:5000
```

### Step 5: Start Frontend
```bash
cd client
npm run dev        # http://localhost:5173
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Mentor | `anjali.mehta@college.edu` | `Demo@123` |
| OS Teacher | `rajesh.sharma@college.edu` | `Demo@123` |
| DBMS Teacher | `neha.patel@college.edu` | `Demo@123` |
| AWT Teacher | `vikram.singh@college.edu` | `Demo@123` |
| Admin | `admin@college.edu` | `Demo@123` |

**Students (35 generated accounts):**
- Example: `aarav.shah@college.edu`, `vivaan.patel@college.edu`, `aditya.joshi@college.edu` 
- Password for all students: `Demo@123`

---

## 10. Project Structure

```
Tarkshastra/
├── client/                        # React Frontend
│   ├── src/
│   │   ├── api/axios.js           # All API functions (60+ exports)
│   │   ├── context/               # AuthContext, SocketContext
│   │   ├── components/shared/     # Layout, StatCard, RiskBadge, Toast, etc.
│   │   ├── pages/
│   │   │   ├── auth/Login.jsx
│   │   │   ├── student/           # Dashboard, Risk, Attendance, LMS, Assignments, Schedule, Grades, HallTicket, Faculty
│   │   │   ├── mentor/            # Dashboard, Students, StudentDetail, Interventions, Remedial
│   │   │   ├── teacher/           # Dashboard, LMS, Assignments, Marks, Grades, Attendance
│   │   │   └── admin/             # Dashboard, Users, Timetable, Classrooms, HallTicket, Events
│   │   └── App.jsx                # 26 routes with PrivateRoute + Layout
│   ├── vite.config.js             # Proxy: /api, /uploads, /socket.io → :5000
│   └── package.json
│
├── server/                        # Express Backend
│   ├── db/
│   │   ├── schema.sql             # 16 tables + indexes
│   │   ├── migrate.js             # Runs schema.sql
│   │   ├── seed.js                # Demo data: users, students, attendance, marks, assignments, LMS, timetable, risk trends, etc.
│   │   └── pool.js                # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT cookie verification
│   │   └── roleGuard.js           # Role-based access control
│   ├── routes/                    # 14 route modules
│   │   ├── auth.js, students.js, attendance.js, marks.js,
│   │   ├── assignments.js, lms.js, interventions.js, timetable.js,
│   │   ├── users.js, hallticket.js, events.js, notifications.js,
│   │   ├── faculty.js, classrooms.js
│   ├── services/
│   │   ├── riskEngine.js          # ML-weighted risk computation + trend + suggestions
│   │   ├── llmService.js          # Grok API integration + rule-based fallback
│   │   ├── socketService.js       # Real-time notification dispatch
│   │   └── scheduler.js           # Cron: risk recomputation (2 AM), class reminders
│   ├── uploads/                   # Auto-created: assignments/, lms/, csv/
│   ├── server.js                  # App entry point
│   ├── .env                       # Environment config
│   └── package.json
│
└── Extra/
    └── feature_weights.json       # ML feature weights: { attendance: 35.82, marks: 31.35, assignment: 20.89, lms: 11.94 }
```

---

## 11. Seed Data Summary

The `seed.js` generates comprehensive demo data:

| Data | Details |
|------|---------|
| **Users** | 40 users (35 students, 1 mentor, 3 teachers, 1 admin) |
| **Students** | 35 students spanning 3 risk groups: 40% good, 40% average, 20% risky |
| **Subjects** | 3 subjects: OS, DBMS, AWT |
| **Attendance** | Over 540+ records generated dynamically between Jan 1 and Apr 17 |
| **Marks** | Mid + Internal + IA + EndSem marks distributed probabilistically by student type |
| **Assignments** | 3 assignments with dynamic submissions (submitted/late/pending) |
| **LMS Content** | 5 materials (PDF, PPT, Video) uploaded by teachers |
| **Timetable** | Full Mon-Sat timetable with balanced subject distribution, labs, and mentor slots |
| **Risk Trends** | 6 weeks of historical risk scores generated dynamically per student |
| **Classrooms** | 6 rooms (L-101, LAB-1, etc.) |
| **Events** | 2 events (Tech Fest, Exam Week) |
| **Interventions** | Counselor logs for automatically generated high-risk students |
| **Notifications** | Alerts tied to events and risk levels |

---

## 12. Key Design Decisions

1. **Risk Score Inversion**: Higher score = better performance (0 = worst, 100 = best). Risk level thresholds: High ≤ 40, Medium 41–70, Low 71–100.
2. **UPSERT Pattern**: Attendance and marks use `ON CONFLICT DO UPDATE` to prevent duplicates during bulk saves.
3. **Promise.allSettled**: Dashboard pages use `Promise.allSettled` instead of `Promise.all` so one failing API doesn't break the entire page.
4. **Route Ordering**: Express routes are carefully ordered — static segments (`/my/subjects`, `/read-all`, `/bulk`) before dynamic params (`/:id`).
5. **Cookie-based Auth**: JWT stored in httpOnly cookies with `sameSite: 'lax'` for CSRF protection.
6. **LLM Fallback**: If Grok API key is not configured, the system falls back to rule-based insights.
7. **Static File Serving**: Uploaded files served via `express.static('/uploads')`, proxied through Vite in development.

---

## 13. Future Enhancements

| Enhancement | Benefit |
|-------------|---------|
| AI-driven personalized study plans | Tailored recommendations per student |
| Mobile app (React Native) | Push notifications, on-the-go access |
| SIS integration | Auto-sync with existing Student Information Systems |
| Advanced analytics | Cohort-level prediction, dropout risk modeling |
| Parent portal | Family engagement in student progress |
| Multi-language support | Accessibility for diverse student bodies |

---

## 14. Conclusion

CampusIQ transforms fragmented academic data into a **single, actionable intelligence platform**. With ML-weighted risk scoring, explainable AI insights, real-time notifications, and a closed-loop intervention workflow, the platform enables:

- **Early detection** of at-risk students before performance degrades
- **Data-driven interventions** with measurable pre/post outcomes
- **Proactive academic support** reducing dropout rates
- **Reduced administrative overhead** through automation

---

*Last updated: 2026-04-19*
