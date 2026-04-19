-- CampusIQ Database Schema v2
-- Run this file to create all tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS risk_scores CASCADE;
DROP TABLE IF EXISTS interventions CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS lms_content CASCADE;
DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS hall_ticket_rules CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'mentor', 'teacher', 'admin')),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  roll_no VARCHAR(20) UNIQUE NOT NULL,
  semester INTEGER NOT NULL DEFAULT 1,
  section VARCHAR(10) NOT NULL DEFAULT 'A',
  mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Faculty
CREATE TABLE faculty (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  department VARCHAR(100),
  cabin_number VARCHAR(20),
  subjects TEXT
);

-- 4. Subjects
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  semester INTEGER NOT NULL DEFAULT 1
);

-- 5. Attendance
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent')),
  UNIQUE(student_id, subject_id, date)
);

-- 6. Marks (mid + internal only; end-sem added when conducted)
CREATE TABLE marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  mid_marks NUMERIC(5,2) DEFAULT 0 CHECK (mid_marks >= 0 AND mid_marks <= 25),
  internal_marks NUMERIC(5,2) DEFAULT 0 CHECK (internal_marks >= 0 AND internal_marks <= 25),
  endsem_marks NUMERIC(5,2) DEFAULT NULL CHECK (endsem_marks IS NULL OR (endsem_marks >= 0 AND endsem_marks <= 100)),
  ia_marks NUMERIC(5,2) DEFAULT 0 CHECK (ia_marks >= 0 AND ia_marks <= 25),
  UNIQUE(student_id, subject_id)
);

-- 7. Assignments
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  deadline TIMESTAMP NOT NULL,
  allow_late BOOLEAN DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Submissions
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  file_url VARCHAR(500),
  original_filename VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('submitted', 'pending', 'late')),
  grade NUMERIC(5,2) DEFAULT NULL,
  grade_remarks TEXT,
  UNIQUE(assignment_id, student_id)
);

-- 9. LMS Content
CREATE TABLE lms_content (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  file_url VARCHAR(500),
  original_filename VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'ppt', 'video', 'link', 'docx')),
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Timetable
CREATE TABLE timetable (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  section VARCHAR(10) NOT NULL DEFAULT 'A',
  day VARCHAR(10) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number VARCHAR(20)
);

-- 11. Interventions (with LLM suggestions stored)
CREATE TABLE interventions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('counseling', 'remedial', 'assignment_extension', 'parent_communication', 'other')),
  remarks TEXT,
  llm_suggestion TEXT,
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Events (with duration)
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Hall Ticket Rules
CREATE TABLE hall_ticket_rules (
  id SERIAL PRIMARY KEY,
  min_attendance_percent NUMERIC(5,2) NOT NULL DEFAULT 75,
  enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Risk Scores (snapshots + LLM insights)
CREATE TABLE risk_scores (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('high', 'medium', 'low')),
  reasons TEXT[],
  llm_insights TEXT,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Classrooms
CREATE TABLE classrooms (
  id SERIAL PRIMARY KEY,
  number VARCHAR(20) UNIQUE NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 60,
  type VARCHAR(20) NOT NULL DEFAULT 'lecture' CHECK (type IN ('lecture', 'lab', 'seminar')),
  building VARCHAR(50),
  is_available BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_subject ON attendance(subject_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_risk_scores_student ON risk_scores(student_id);
CREATE INDEX idx_timetable_section ON timetable(section);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_mentor ON students(mentor_id);
