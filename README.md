# 🎓 CampusIQ
### **Predicting Success, Preventing Failure: The Intelligent Campus Operating System**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-4169E1?logo=postgresql)](https://www.postgresql.org/)

---

## 🚀 The Problem
Universities often identify at-risk students **too late**. Critical indicators like declining attendance, low internal marks, and missed assignments are scattered across fragmented systems, leaving faculty to rely on subjective judgment and delayed reports. This leads to missed opportunities for early intervention and higher dropout rates.

**CampusIQ** bridges this gap by centralizing academic signals into a real-time monitoring platform that utilizes **explainable AI-driven insights** to detect risk early and enable proactive student support.

---

## ✨ Key Features
CampusIQ provides a unified ecosystem with four specialized role-based portals:

- **🧠 Multi-Factor Risk Engine:** Uses ML-weighted scoring (Attendance, Marks, LMS Activity) to categorize student risk levels with explainable insights.
- **📊 Real-time Dashboards:** Interactive heatmaps, line charts for risk trends, and performance distributions for students and mentors.
- **📅 Smart Attendance & Scheduling:** Integrated calendar views for students and bulk-toggle sync for teachers linked directly to the campus timetable.
- **📚 Learning Hub (LMS):** A centralized repository for study materials (PDF, Video, etc.) with seamless upload and download workflows.
- **📝 Automated Marks Management:** Streamlined entry for Mid-Sem, Internals, and IA with CSV export/import capabilities.
- **🔔 Proactive Interventions:** Dedicated mentor workflow for logging counseling sessions and remedial actions based on AI suggestions.
- **🎫 Hall Ticket Eligibility:** Automated rule-based system to check attendance criteria and generate eligibility statuses.

---

## 🛠 Tech Stack
| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Recharts, Axios, Socket.io Client |
| **Backend** | Node.js, Express.js, JWT (HttpOnly Cookies), Socket.io, Node-cron |
| **Database** | PostgreSQL 13+ |
| **AI/ML** | Rule-based Risk Engine with SHAP feature weights, Grok LLM (Optional) |
| **DevOps** | Multer (File Uploads), Nodemailer (Email Alerts) |

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd CampusIQ
```

### 2. Install Dependencies
```bash
# Install Server dependencies
cd server && npm install

# Install Client dependencies
cd ../client && npm install
```

### 3. Environment Setup
Create a `.env` file in the `server` directory:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campusiq
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

### 4. Database Initialization
```bash
# From the server directory
psql -U postgres -c "CREATE DATABASE campusiq;"
npm run migrate    # Create schema (16 tables)
npm run seed       # Seed demo data (35 students, 4 faculty)
```

### 5. Run the Application
**Backend:**
```bash
cd server
npm start
```
**Frontend:**
```bash
cd client
npm run dev
```
*Access the app at `http://localhost:5173`*

---

## 📁 Project Structure
```text
CampusIQ/
├── client/                # React Frontend (Vite)
│   ├── src/
│   │   ├── api/           # API service layer (Axios)
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Role-based views (Student/Teacher/Mentor/Admin)
│   │   └── context/        # Auth & Socket state management
├── server/                # Express Backend
│   ├── db/                # Schema, Migrations, and Seeding scripts
│   ├── routes/            # API Route modules (14 modules)
│   ├── services/          # Business logic (Risk Engine, LLM, Sockets)
│   └── middleware/        # JWT Auth & Role Guards
└── Extra/                 # Data assets and ML weights
```

---

## 🌐 Deployment
- **Live Demo:** [Click here to view the live site](https://your-demo-link.com) *(Placeholder)*
- **Presentation:** [View Hackathon Pitch Deck](https://your-deck-link.com) *(Placeholder)*

---

## 👥 The Team
**Team Tarkshastra**
- **[Member Name 1]** - [GitHub Profile](https://github.com/username1)
- **[Member Name 2]** - [GitHub Profile](https://github.com/username2)
- **[Member Name 3]** - [GitHub Profile](https://github.com/username3)
- **[Member Name 4]** - [GitHub Profile](https://github.com/username4)

---
*Developed for Hackathon 2026 | Track: Ed-Tech / AI for Good*
