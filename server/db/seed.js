const bcrypt = require('bcryptjs');
const pool = require('./pool');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function getDates(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= new Date(end)) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getStudentType(index) {
  if (index < 14) return "good";     // 40%
  if (index < 28) return "average";  // 40%
  return "risky";                    // 20%
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Hash password
    const hash = await bcrypt.hash('Demo@123', 10);

    // 1. Create Users (Admin, Mentor, Teachers)
    const staffUsers = [
      { name: 'Admin User', email: 'admin@college.edu', role: 'admin', department: 'Administration' },
      { name: 'Dr. Anjali Mehta', email: 'anjali.mehta@college.edu', role: 'mentor', department: 'CSE' },
      { name: 'Prof. Rajesh Sharma', email: 'rajesh.sharma@college.edu', role: 'teacher', department: 'CSE' },
      { name: 'Prof. Neha Patel', email: 'neha.patel@college.edu', role: 'teacher', department: 'CSE' },
      { name: 'Prof. Vikram Singh', email: 'vikram.singh@college.edu', role: 'teacher', department: 'CSE' },
    ];

    const userIds = {};
    for (const u of staffUsers) {
      const res = await client.query(
        'INSERT INTO users (name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [u.name, u.email, hash, u.role, u.department]
      );
      userIds[u.email] = res.rows[0].id;
    }

    // 2. Create Students (35 Users)
    const studentNames = [
      'Aarav Shah', 'Vivaan Patel', 'Aditya Joshi', 'Krishna Iyer', 'Arjun Reddy', 'Sai Kumar', 'Rohan Desai', 'Yash Verma', 'Harsh Gupta', 'Manav Jain',
      'Riya Shah', 'Ananya Patel', 'Diya Mehta', 'Kavya Nair', 'Ishita Singh', 'Pooja Sharma', 'Sneha Iyer', 'Aditi Desai', 'Meera Joshi', 'Nisha Gupta',
      'Rahul Mishra', 'Aman Yadav', 'Kunal Agarwal', 'Deepak Choudhary', 'Siddharth Roy',
      'Tanvi Kulkarni', 'Shruti Menon', 'Priya Nair', 'Komal Jain', 'Neelam Verma',
      'Mohit Saxena', 'Varun Khanna', 'Akash Pandey', 'Nitin Bansal', 'Rajat Kapoor'
    ];
    
    const studentsList = [];
    for (let i = 0; i < studentNames.length; i++) {
      const email = studentNames[i].toLowerCase().replace(' ', '.') + '@college.edu';
      const res = await client.query(
        'INSERT INTO users (name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [studentNames[i], email, hash, 'student', 'CSE']
      );
      studentsList.push({ id: res.rows[0].id, name: studentNames[i], email, index: i });
      userIds[email] = res.rows[0].id;
    }
    console.log('✅ Users seeded');

    // 3. Create Faculty
    const facultyData = [
      { userId: userIds['anjali.mehta@college.edu'], dept: 'CSE', cabin: 'C-201', subjects: 'Mentor' },
      { userId: userIds['rajesh.sharma@college.edu'], dept: 'CSE', cabin: 'C-301', subjects: 'Operating Systems' },
      { userId: userIds['neha.patel@college.edu'], dept: 'CSE', cabin: 'C-302', subjects: 'DBMS' },
      { userId: userIds['vikram.singh@college.edu'], dept: 'CSE', cabin: 'C-303', subjects: 'AWT' },
    ];
    for (const f of facultyData) {
      await client.query(
        'INSERT INTO faculty (user_id, department, cabin_number, subjects) VALUES ($1, $2, $3, $4)',
        [f.userId, f.dept, f.cabin, f.subjects]
      );
    }
    console.log('✅ Faculty seeded');

    // 4. Create Students profiles
    const studentProfileIds = {};
    for (let i = 0; i < studentsList.length; i++) {
      const s = studentsList[i];
      const rollNo = `23BCP${(i + 101).toString()}`;
      const res = await client.query(
        'INSERT INTO students (user_id, roll_no, semester, section, mentor_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [s.id, rollNo, 5, 'A', userIds['anjali.mehta@college.edu']]
      );
      studentProfileIds[s.email] = res.rows[0].id;
      studentsList[i].profileId = res.rows[0].id;
    }
    console.log('✅ Students seeded');

    // 5. Create Subjects
    const subjectsData = [
      { name: 'Operating Systems', code: 'CS301', teacherId: userIds['rajesh.sharma@college.edu'], semester: 5 },
      { name: 'Database Management Systems', code: 'CS302', teacherId: userIds['neha.patel@college.edu'], semester: 5 },
      { name: 'Advanced Web Technology', code: 'CS303', teacherId: userIds['vikram.singh@college.edu'], semester: 5 },
    ];
    const subjectIds = {};
    const subjectList = [];
    for (const s of subjectsData) {
      const res = await client.query(
        'INSERT INTO subjects (name, code, teacher_id, semester) VALUES ($1, $2, $3, $4) RETURNING id',
        [s.name, s.code, s.teacherId, s.semester]
      );
      subjectIds[s.code] = res.rows[0].id;
      subjectList.push({ id: res.rows[0].id, code: s.code, name: s.name });
    }
    console.log('✅ Subjects seeded');

    // 6. Timetable
    const timetableData = [
      // Monday
      { subjectId: subjectIds['CS301'], day: 'Monday', start: '09:00', end: '10:00', room: 'L-101' },
      { subjectId: subjectIds['CS302'], day: 'Monday', start: '10:00', end: '11:00', room: 'L-102' },
      { subjectId: subjectIds['CS303'], day: 'Monday', start: '11:15', end: '12:15', room: 'L-103' },
      { subjectId: subjectIds['CS301'], day: 'Monday', start: '12:15', end: '13:15', room: 'L-101' },
      { subjectId: subjectIds['CS302'], day: 'Monday', start: '14:00', end: '16:00', room: 'LAB-1' },
      // Tuesday
      { subjectId: subjectIds['CS302'], day: 'Tuesday', start: '09:00', end: '10:00', room: 'L-102' },
      { subjectId: subjectIds['CS303'], day: 'Tuesday', start: '10:00', end: '11:00', room: 'L-103' },
      { subjectId: subjectIds['CS301'], day: 'Tuesday', start: '11:15', end: '12:15', room: 'L-101' },
      { subjectId: subjectIds['CS302'], day: 'Tuesday', start: '12:15', end: '13:15', room: 'L-102' },
      { subjectId: subjectIds['CS303'], day: 'Tuesday', start: '14:00', end: '16:00', room: 'LAB-2' },
      // Wednesday
      { subjectId: subjectIds['CS303'], day: 'Wednesday', start: '09:00', end: '10:00', room: 'L-103' },
      { subjectId: subjectIds['CS301'], day: 'Wednesday', start: '10:00', end: '11:00', room: 'L-101' },
      { subjectId: subjectIds['CS302'], day: 'Wednesday', start: '11:15', end: '12:15', room: 'L-102' },
      { subjectId: subjectIds['CS303'], day: 'Wednesday', start: '12:15', end: '13:15', room: 'L-103' },
      { subjectId: subjectIds['CS301'], day: 'Wednesday', start: '14:00', end: '16:00', room: 'LAB-1' },
      // Thursday
      { subjectId: subjectIds['CS301'], day: 'Thursday', start: '09:00', end: '10:00', room: 'L-101' },
      { subjectId: subjectIds['CS302'], day: 'Thursday', start: '10:00', end: '11:00', room: 'L-102' },
      { subjectId: subjectIds['CS303'], day: 'Thursday', start: '11:15', end: '12:15', room: 'L-103' },
      { subjectId: subjectIds['CS302'], day: 'Thursday', start: '12:15', end: '13:15', room: 'L-102' },
      // Friday
      { subjectId: subjectIds['CS302'], day: 'Friday', start: '09:00', end: '10:00', room: 'L-102' },
      { subjectId: subjectIds['CS301'], day: 'Friday', start: '10:00', end: '11:00', room: 'L-101' },
      { subjectId: subjectIds['CS303'], day: 'Friday', start: '11:15', end: '12:15', room: 'L-103' },
      { subjectId: subjectIds['CS301'], day: 'Friday', start: '12:15', end: '13:15', room: 'L-101' },
      { subjectId: subjectIds['CS303'], day: 'Friday', start: '14:00', end: '16:00', room: 'LAB-2' },
      // Saturday
      { subjectId: subjectIds['CS303'], day: 'Saturday', start: '09:00', end: '10:00', room: 'L-103' },
      { subjectId: subjectIds['CS302'], day: 'Saturday', start: '10:00', end: '11:00', room: 'L-102' },
      { subjectId: subjectIds['CS301'], day: 'Saturday', start: '11:15', end: '12:15', room: 'L-101' },
    ];
    for (const t of timetableData) {
      await client.query(
        'INSERT INTO timetable (subject_id, section, day, start_time, end_time, room_number) VALUES ($1, $2, $3, $4, $5, $6)',
        [t.subjectId, 'A', t.day, t.start, t.end, t.room]
      );
    }
    console.log('✅ Timetable seeded');

    // 7. Generate Attendance Data
    const dates = getDates("2026-01-01", "2026-04-17");
    let attendanceCount = 0;
    
    // Batch insert helper for performance
    const insertAttendance = async (records) => {
      for (const r of records) {
        await client.query(
          'INSERT INTO attendance (student_id, subject_id, date, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [r.student_id, r.subject_id, r.date, r.status]
        );
        attendanceCount++;
      }
    };
    
    let attBatch = [];
    for (const date of dates) {
      const day = date.getDay(); // 0 = Sunday
      if (day === 0) continue; // skip Sunday
      
      const dateStr = date.toISOString().split("T")[0];
      for (const student of studentsList) {
        const type = getStudentType(student.index);
        
        for (const subject of subjectList) {
          let baseProb;
          if (type === "good") baseProb = 0.80;
          else if (type === "average") baseProb = 0.55;
          else baseProb = 0.35;
          
          // Student specific variance to make data distinctly varied per student instead of uniformly random
          const studentVariance = (student.index % 5) * 0.05; 
          const probability = Math.min(0.98, baseProb + studentVariance);
          
          const status = Math.random() < probability ? "present" : "absent";
          attBatch.push({ student_id: student.profileId, subject_id: subject.id, date: dateStr, status });
          
          if (attBatch.length > 500) {
            await insertAttendance(attBatch);
            attBatch = [];
          }
        }
      }
    }
    if (attBatch.length > 0) await insertAttendance(attBatch);
    console.log(`✅ Attendance seeded (${attendanceCount} records)`);

    // 8. Generate Marks
    for (const student of studentsList) {
      const type = getStudentType(student.index);
      
      // Personal offset to make students distinct (some always get high, some low within their band)
      const personalOffset = (student.index % 4) - 2; 

      for (const subject of subjectList) {
        let mid, internal, ia, endsem;
        if (type === "good") {
          mid = Math.min(25, Math.max(15, rand(18, 23) + personalOffset)); 
          internal = Math.min(25, Math.max(15, rand(18, 23) + personalOffset)); 
          ia = Math.min(25, Math.max(15, rand(18, 23) + personalOffset)); 
          endsem = Math.min(100, Math.max(60, rand(75, 90) + (personalOffset * 3)));
        } else if (type === "average") {
          mid = Math.min(25, Math.max(8, rand(12, 17) + personalOffset)); 
          internal = Math.min(25, Math.max(8, rand(12, 17) + personalOffset)); 
          ia = Math.min(25, Math.max(8, rand(12, 17) + personalOffset)); 
          endsem = Math.min(100, Math.max(40, rand(50, 70) + (personalOffset * 2)));
        } else {
          mid = Math.min(25, Math.max(0, rand(4, 9) + personalOffset)); 
          internal = Math.min(25, Math.max(0, rand(4, 9) + personalOffset)); 
          ia = Math.min(25, Math.max(0, rand(4, 9) + personalOffset)); 
          endsem = Math.min(100, Math.max(10, rand(25, 45) + (personalOffset * 2)));
        }
        await client.query(
          'INSERT INTO marks (student_id, subject_id, mid_marks, internal_marks, ia_marks, endsem_marks) VALUES ($1, $2, $3, $4, $5, $6)',
          [student.profileId, subject.id, mid, internal, ia, endsem]
        );
      }
    }
    console.log('✅ Marks seeded');

    // 9. Assignments
    const assignmentsData = [
      // OS (5 assignments)
      { title: "OS Process Scheduling", desc: "Implement process scheduling algorithms.", deadline: "2026-02-10", subjectId: subjectIds['CS301'], creator: userIds['rajesh.sharma@college.edu'] },
      { title: "Memory Management Simulation", desc: "Simulate paging and segmentation.", deadline: "2026-02-25", subjectId: subjectIds['CS301'], creator: userIds['rajesh.sharma@college.edu'] },
      { title: "Deadlock Detection", desc: "Banker's algorithm implementation.", deadline: "2026-03-15", subjectId: subjectIds['CS301'], creator: userIds['rajesh.sharma@college.edu'] },
      { title: "File Systems Overview", desc: "Report on Linux EXT4 vs Windows NTFS.", deadline: "2026-04-05", subjectId: subjectIds['CS301'], creator: userIds['rajesh.sharma@college.edu'] },
      { title: "Concurrency in C", desc: "Write a multi-threaded server.", deadline: "2026-04-20", subjectId: subjectIds['CS301'], creator: userIds['rajesh.sharma@college.edu'] },
      
      // DBMS (3 assignments)
      { title: "DBMS Normalization", desc: "Normalize the given schema up to 3NF.", deadline: "2026-02-20", subjectId: subjectIds['CS302'], creator: userIds['neha.patel@college.edu'] },
      { title: "SQL Complex Queries", desc: "Write queries using JOINS, GROUP BY, and HAVING.", deadline: "2026-03-25", subjectId: subjectIds['CS302'], creator: userIds['neha.patel@college.edu'] },
      { title: "Transaction Management", desc: "Explain ACID properties with examples.", deadline: "2026-04-15", subjectId: subjectIds['CS302'], creator: userIds['neha.patel@college.edu'] },
      
      // AWT (2 assignments)
      { title: "AWT React App", desc: "Create a simple React app connecting to an API.", deadline: "2026-03-05", subjectId: subjectIds['CS303'], creator: userIds['vikram.singh@college.edu'] },
      { title: "Node.js Authentication", desc: "Implement JWT based authentication in Express.", deadline: "2026-04-10", subjectId: subjectIds['CS303'], creator: userIds['vikram.singh@college.edu'] },
    ];
    const assignmentsList = [];
    for (const a of assignmentsData) {
      const res = await client.query(
        'INSERT INTO assignments (subject_id, title, description, deadline, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [a.subjectId, a.title, a.desc, a.deadline, a.creator]
      );
      assignmentsList.push({ id: res.rows[0].id, title: a.title });
    }
    console.log('✅ Assignments seeded');

    // 10. Submissions
    for (const student of studentsList) {
      const type = getStudentType(student.index);
      for (const assign of assignmentsList) {
        let status, grade;
        if (type === "good") {
          status = "submitted"; grade = rand(80, 100);
        } else if (type === "average") {
          status = Math.random() < 0.8 ? "submitted" : "late"; grade = rand(50, 80);
        } else {
          status = Math.random() < 0.5 ? "submitted" : "pending"; grade = rand(20, 60);
        }
        
        if (status === 'pending') {
          await client.query(
            'INSERT INTO submissions (assignment_id, student_id, status) VALUES ($1, $2, $3)',
            [assign.id, student.profileId, status]
          );
        } else {
          await client.query(
            'INSERT INTO submissions (assignment_id, student_id, file_url, original_filename, submitted_at, status, grade) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [assign.id, student.profileId, `/uploads/${student.profileId}_${assign.id}.pdf`, `assignment_${assign.id}.pdf`, new Date().toISOString(), status, grade]
          );
        }
      }
    }
    console.log('✅ Submissions seeded');

    // 11. Generate Risk Scores for Trends (6 weeks back from April 17)
    for (const student of studentsList) {
      const type = getStudentType(student.index);
      for (let w = 0; w < 6; w++) {
        const computedDate = new Date('2026-03-01');
        computedDate.setDate(computedDate.getDate() + w * 7);
        
        let score;
        if (type === "good") score = rand(75, 95);
        else if (type === "average") score = rand(45, 70);
        else score = rand(15, 35);
        
        const level = score >= 71 ? 'low' : score >= 41 ? 'medium' : 'high';
        const reasons = [];
        if (score < 70) reasons.push('Attendance below optimal');
        if (score < 50) reasons.push('Low internal marks');
        
        await client.query(
          'INSERT INTO risk_scores (student_id, score, level, reasons, computed_at) VALUES ($1, $2, $3, $4, $5)',
          [student.profileId, score, level, reasons, computedDate.toISOString()]
        );
      }
    }
    console.log('✅ Risk trend data seeded');

    // Keep existing metadata structure (Classrooms, Events, Hall Ticket Rules)
    const classroomsData = [
      { number: 'L-101', capacity: 60, type: 'lecture', building: 'Main Block' },
      { number: 'L-102', capacity: 60, type: 'lecture', building: 'Main Block' },
      { number: 'L-103', capacity: 60, type: 'lecture', building: 'Main Block' },
      { number: 'LAB-1', capacity: 30, type: 'lab', building: 'Tech Block' },
      { number: 'LAB-2', capacity: 30, type: 'lab', building: 'Tech Block' },
      { number: 'C-201', capacity: 20, type: 'seminar', building: 'Admin Block' },
    ];
    for (const r of classroomsData) {
      await client.query(
        'INSERT INTO classrooms (number, capacity, type, building) VALUES ($1, $2, $3, $4) ON CONFLICT (number) DO NOTHING',
        [r.number, r.capacity, r.type, r.building]
      );
    }
    console.log('✅ Classrooms seeded');

    // LMS Content
    const lmsData = [
      { subjectId: subjectIds['CS301'], title: 'Introduction to Process Scheduling', type: 'pdf', uploaded_by: userIds['rajesh.sharma@college.edu'] },
      { subjectId: subjectIds['CS301'], title: 'Deadlock avoidance notes', type: 'docx', uploaded_by: userIds['rajesh.sharma@college.edu'] },
      { subjectId: subjectIds['CS302'], title: 'SQL Queries basics', type: 'pdf', uploaded_by: userIds['neha.patel@college.edu'] },
      { subjectId: subjectIds['CS302'], title: 'ER Diagram Tutorial', type: 'video', uploaded_by: userIds['neha.patel@college.edu'] },
      { subjectId: subjectIds['CS303'], title: 'HTML & CSS Basics', type: 'ppt', uploaded_by: userIds['vikram.singh@college.edu'] },
    ];
    for (const l of lmsData) {
      await client.query(
        'INSERT INTO lms_content (subject_id, title, file_url, type, uploaded_by) VALUES ($1, $2, $3, $4, $5)',
        [l.subjectId, l.title, `/uploads/lms/${l.title.replace(/\s+/g, '_').toLowerCase()}.${l.type === 'video' ? 'mp4' : l.type}`, l.type, l.uploaded_by]
      );
    }
    console.log('✅ LMS Content seeded');

    // Events
    await client.query(
      'INSERT INTO events (title, start_date, end_date, description, created_by) VALUES ($1, $2, $3, $4, $5)',
      ['Annual Tech Fest 2026', '2026-05-15', '2026-05-17', 'Annual technology festival with hackathons.', userIds['admin@college.edu']]
    );
    await client.query(
      'INSERT INTO events (title, start_date, end_date, description, created_by) VALUES ($1, $2, $3, $4, $5)',
      ['Mid-Semester Exam Week', '2026-04-28', '2026-05-02', 'Mid-semester examinations.', userIds['admin@college.edu']]
    );

    await client.query(
      'INSERT INTO hall_ticket_rules (min_attendance_percent, enabled) VALUES ($1, $2)',
      [75, true]
    );

    // Interventions
    const riskyStudents = studentsList.filter(s => getStudentType(s.index) === 'risky');
    if (riskyStudents.length > 0) {
      await client.query(
        'INSERT INTO interventions (student_id, mentor_id, type, remarks) VALUES ($1, $2, $3, $4)',
        [riskyStudents[0].profileId, userIds['anjali.mehta@college.edu'], 'counseling', 'Student has been consistently missing classes. Scheduled counseling.']
      );
    }
    
    // Notifications
    await client.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [userIds['anjali.mehta@college.edu'], `Multiple students flagged as High Risk in recent analysis.`]
    );

    await client.query('COMMIT');
    console.log('\n🎉 All seed data inserted successfully!');
    console.log('\n📋 Demo Credentials (Password: Demo@123):');
    console.log('   Mentor:  anjali.mehta@college.edu');
    console.log('   OS:      rajesh.sharma@college.edu');
    console.log('   DBMS:    neha.patel@college.edu');
    console.log('   AWT:     vikram.singh@college.edu');
    console.log('   Student: aarav.shah@college.edu (or any name)');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
