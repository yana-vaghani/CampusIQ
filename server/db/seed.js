const bcrypt = require('bcryptjs');
const pool = require('./pool');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Hash password
    const hash = await bcrypt.hash('Demo@1234', 10);

    // 1. Create Users
    const users = [
      { name: 'Alex Student', email: 'student@demo.com', role: 'student', department: 'Computer Science' },
      { name: 'Dr. Sarah Mentor', email: 'mentor@demo.com', role: 'mentor', department: 'Computer Science' },
      { name: 'Prof. James Teacher', email: 'teacher@demo.com', role: 'teacher', department: 'Computer Science' },
      { name: 'Admin User', email: 'admin@demo.com', role: 'admin', department: 'Administration' },
      // Extra students for mentor view
      { name: 'Emma Wilson', email: 'emma@demo.com', role: 'student', department: 'Computer Science' },
      { name: 'Liam Chen', email: 'liam@demo.com', role: 'student', department: 'Computer Science' },
      { name: 'Sophia Patel', email: 'sophia@demo.com', role: 'student', department: 'Computer Science' },
      { name: 'Noah Garcia', email: 'noah@demo.com', role: 'student', department: 'Computer Science' },
      { name: 'Olivia Brown', email: 'olivia@demo.com', role: 'student', department: 'Computer Science' },
      // Extra teacher
      { name: 'Dr. Maria Physics', email: 'maria@demo.com', role: 'teacher', department: 'Physics' },
      { name: 'Prof. Robert Math', email: 'robert@demo.com', role: 'teacher', department: 'Mathematics' },
    ];

    const userIds = {};
    for (const u of users) {
      const res = await client.query(
        'INSERT INTO users (name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [u.name, u.email, hash, u.role, u.department]
      );
      userIds[u.email] = res.rows[0].id;
    }
    console.log('✅ Users seeded');

    // 2. Create Faculty
    const facultyData = [
      { userId: userIds['mentor@demo.com'], dept: 'Computer Science', cabin: 'C-201', subjects: 'Data Structures, Algorithms' },
      { userId: userIds['teacher@demo.com'], dept: 'Computer Science', cabin: 'C-305', subjects: 'Computer Science' },
      { userId: userIds['maria@demo.com'], dept: 'Physics', cabin: 'P-102', subjects: 'Physics' },
      { userId: userIds['robert@demo.com'], dept: 'Mathematics', cabin: 'M-204', subjects: 'Mathematics' },
    ];
    for (const f of facultyData) {
      await client.query(
        'INSERT INTO faculty (user_id, department, cabin_number, subjects) VALUES ($1, $2, $3, $4)',
        [f.userId, f.dept, f.cabin, f.subjects]
      );
    }
    console.log('✅ Faculty seeded');

    // 3. Create Students
    const studentEmails = ['student@demo.com', 'emma@demo.com', 'liam@demo.com', 'sophia@demo.com', 'noah@demo.com', 'olivia@demo.com'];
    const rollNos = ['CS2024001', 'CS2024002', 'CS2024003', 'CS2024004', 'CS2024005', 'CS2024006'];
    const studentIds = {};

    for (let i = 0; i < studentEmails.length; i++) {
      const res = await client.query(
        'INSERT INTO students (user_id, roll_no, semester, section, mentor_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userIds[studentEmails[i]], rollNos[i], 4, 'A', userIds['mentor@demo.com']]
      );
      studentIds[studentEmails[i]] = res.rows[0].id;
    }
    console.log('✅ Students seeded');

    // 4. Create Subjects
    const subjectsData = [
      { name: 'Mathematics', code: 'MA201', teacherId: userIds['robert@demo.com'], semester: 4 },
      { name: 'Physics', code: 'PH201', teacherId: userIds['maria@demo.com'], semester: 4 },
      { name: 'Computer Science', code: 'CS201', teacherId: userIds['teacher@demo.com'], semester: 4 },
    ];
    const subjectIds = {};
    for (const s of subjectsData) {
      const res = await client.query(
        'INSERT INTO subjects (name, code, teacher_id, semester) VALUES ($1, $2, $3, $4) RETURNING id',
        [s.name, s.code, s.teacherId, s.semester]
      );
      subjectIds[s.code] = res.rows[0].id;
    }
    console.log('✅ Subjects seeded');

    // 5. Create Attendance (30 records per student per subject)
    const statuses = ['present', 'absent'];
    // Different attendance patterns per student
    const attendanceWeights = {
      'student@demo.com': 0.65,  // 65% - medium risk
      'emma@demo.com': 0.90,     // 90% - low risk
      'liam@demo.com': 0.45,     // 45% - high risk
      'sophia@demo.com': 0.78,   // 78% - medium/low
      'noah@demo.com': 0.55,     // 55% - high risk
      'olivia@demo.com': 0.85,   // 85% - low risk
    };

    const startDate = new Date('2026-01-15');
    for (const email of studentEmails) {
      const sId = studentIds[email];
      const weight = attendanceWeights[email];
      for (const [code, subId] of Object.entries(subjectIds)) {
        for (let d = 0; d < 30; d++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + d);
          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          const status = Math.random() < weight ? 'present' : 'absent';
          await client.query(
            'INSERT INTO attendance (student_id, subject_id, date, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [sId, subId, date.toISOString().split('T')[0], status]
          );
        }
      }
    }
    console.log('✅ Attendance seeded');

    // 6. Create Marks (varied per student)
    const marksData = {
      'student@demo.com': { mid: [15, 12, 18], internal: [14, 10, 16], endsem: [55, 45, 65] },
      'emma@demo.com':    { mid: [22, 20, 23], internal: [21, 19, 22], endsem: [85, 78, 90] },
      'liam@demo.com':    { mid: [8, 10, 12],  internal: [7, 9, 10],  endsem: [30, 35, 40] },
      'sophia@demo.com':  { mid: [18, 16, 20], internal: [17, 15, 18], endsem: [65, 60, 72] },
      'noah@demo.com':    { mid: [10, 13, 11], internal: [9, 11, 8],  endsem: [38, 42, 35] },
      'olivia@demo.com':  { mid: [20, 21, 19], internal: [19, 20, 18], endsem: [75, 80, 70] },
    };
    const subjectCodes = Object.keys(subjectIds);
    for (const email of studentEmails) {
      const sId = studentIds[email];
      const m = marksData[email];
      for (let i = 0; i < subjectCodes.length; i++) {
        await client.query(
          'INSERT INTO marks (student_id, subject_id, mid_marks, internal_marks, endsem_marks) VALUES ($1, $2, $3, $4, $5)',
          [sId, subjectIds[subjectCodes[i]], m.mid[i], m.internal[i], m.endsem[i]]
        );
      }
    }
    console.log('✅ Marks seeded');

    // 7. Create Assignments
    const assignmentsData = [
      { subjectId: subjectIds['CS201'], title: 'Data Structures Assignment 1', desc: 'Implement a binary search tree with all operations', deadline: '2026-04-25 23:59:00' },
      { subjectId: subjectIds['CS201'], title: 'Algorithm Analysis Report', desc: 'Analyze time complexity of sorting algorithms', deadline: '2026-04-20 23:59:00' },
      { subjectId: subjectIds['MA201'], title: 'Calculus Problem Set 3', desc: 'Solve integration problems from Chapter 5', deadline: '2026-04-22 23:59:00' },
      { subjectId: subjectIds['PH201'], title: 'Quantum Mechanics Lab Report', desc: 'Write a lab report on the double-slit experiment', deadline: '2026-04-18 23:59:00' },
      { subjectId: subjectIds['PH201'], title: 'Thermodynamics Assignment', desc: 'Solve problems on entropy and heat engines', deadline: '2026-05-01 23:59:00' },
    ];
    const assignmentIds = [];
    for (const a of assignmentsData) {
      const res = await client.query(
        'INSERT INTO assignments (subject_id, title, description, deadline, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [a.subjectId, a.title, a.desc, a.deadline, userIds['teacher@demo.com']]
      );
      assignmentIds.push(res.rows[0].id);
    }
    console.log('✅ Assignments seeded');

    // 8. Create Submissions
    const submissionStatuses = [
      { assignmentIdx: 0, email: 'student@demo.com', status: 'submitted', date: '2026-04-20 14:30:00' },
      { assignmentIdx: 1, email: 'student@demo.com', status: 'late', date: '2026-04-21 02:15:00' },
      { assignmentIdx: 2, email: 'student@demo.com', status: 'pending', date: null },
      { assignmentIdx: 3, email: 'student@demo.com', status: 'submitted', date: '2026-04-17 18:00:00' },
      { assignmentIdx: 4, email: 'student@demo.com', status: 'pending', date: null },
      { assignmentIdx: 0, email: 'emma@demo.com', status: 'submitted', date: '2026-04-19 10:00:00' },
      { assignmentIdx: 1, email: 'emma@demo.com', status: 'submitted', date: '2026-04-19 11:00:00' },
      { assignmentIdx: 2, email: 'emma@demo.com', status: 'submitted', date: '2026-04-20 09:00:00' },
      { assignmentIdx: 0, email: 'liam@demo.com', status: 'pending', date: null },
      { assignmentIdx: 1, email: 'liam@demo.com', status: 'pending', date: null },
    ];
    for (const s of submissionStatuses) {
      if (s.status === 'pending') {
        await client.query(
          'INSERT INTO submissions (assignment_id, student_id, status) VALUES ($1, $2, $3)',
          [assignmentIds[s.assignmentIdx], studentIds[s.email], s.status]
        );
      } else {
        await client.query(
          'INSERT INTO submissions (assignment_id, student_id, file_url, submitted_at, status) VALUES ($1, $2, $3, $4, $5)',
          [assignmentIds[s.assignmentIdx], studentIds[s.email], `/uploads/assignment_${s.assignmentIdx}.pdf`, s.date, s.status]
        );
      }
    }
    console.log('✅ Submissions seeded');

    // 9. Create LMS Content
    const lmsData = [
      { subjectId: subjectIds['CS201'], title: 'Introduction to Data Structures', type: 'pdf' },
      { subjectId: subjectIds['CS201'], title: 'Sorting Algorithms Lecture', type: 'video' },
      { subjectId: subjectIds['CS201'], title: 'Trees and Graphs PPT', type: 'ppt' },
      { subjectId: subjectIds['MA201'], title: 'Calculus Fundamentals', type: 'pdf' },
      { subjectId: subjectIds['MA201'], title: 'Linear Algebra Notes', type: 'pdf' },
      { subjectId: subjectIds['MA201'], title: 'Differential Equations Lecture', type: 'video' },
      { subjectId: subjectIds['PH201'], title: 'Quantum Mechanics Basics', type: 'pdf' },
      { subjectId: subjectIds['PH201'], title: 'Thermodynamics Slides', type: 'ppt' },
      { subjectId: subjectIds['PH201'], title: 'Optics Lab Demo', type: 'video' },
    ];
    for (const l of lmsData) {
      await client.query(
        'INSERT INTO lms_content (subject_id, title, file_url, type) VALUES ($1, $2, $3, $4)',
        [l.subjectId, l.title, `/uploads/lms/${l.title.replace(/\s+/g, '_').toLowerCase()}.${l.type === 'video' ? 'mp4' : l.type}`, l.type]
      );
    }
    console.log('✅ LMS Content seeded');

    // 10. Create Timetable (Mon-Fri)
    const timetableData = [
      { subjectId: subjectIds['MA201'], day: 'Monday', start: '09:00', end: '10:00', room: 'LH-101' },
      { subjectId: subjectIds['PH201'], day: 'Monday', start: '10:15', end: '11:15', room: 'LH-102' },
      { subjectId: subjectIds['CS201'], day: 'Monday', start: '11:30', end: '12:30', room: 'Lab-201' },
      { subjectId: subjectIds['CS201'], day: 'Tuesday', start: '09:00', end: '10:00', room: 'Lab-201' },
      { subjectId: subjectIds['MA201'], day: 'Tuesday', start: '10:15', end: '11:15', room: 'LH-101' },
      { subjectId: subjectIds['PH201'], day: 'Tuesday', start: '14:00', end: '15:00', room: 'LH-102' },
      { subjectId: subjectIds['PH201'], day: 'Wednesday', start: '09:00', end: '10:00', room: 'Lab-301' },
      { subjectId: subjectIds['MA201'], day: 'Wednesday', start: '11:30', end: '12:30', room: 'LH-101' },
      { subjectId: subjectIds['CS201'], day: 'Wednesday', start: '14:00', end: '15:30', room: 'Lab-201' },
      { subjectId: subjectIds['MA201'], day: 'Thursday', start: '09:00', end: '10:00', room: 'LH-101' },
      { subjectId: subjectIds['CS201'], day: 'Thursday', start: '10:15', end: '11:15', room: 'Lab-201' },
      { subjectId: subjectIds['PH201'], day: 'Thursday', start: '14:00', end: '15:00', room: 'LH-102' },
      { subjectId: subjectIds['CS201'], day: 'Friday', start: '09:00', end: '10:30', room: 'Lab-201' },
      { subjectId: subjectIds['PH201'], day: 'Friday', start: '11:00', end: '12:00', room: 'LH-102' },
      { subjectId: subjectIds['MA201'], day: 'Friday', start: '14:00', end: '15:00', room: 'LH-101' },
    ];
    for (const t of timetableData) {
      await client.query(
        'INSERT INTO timetable (subject_id, section, day, start_time, end_time, room_number) VALUES ($1, $2, $3, $4, $5, $6)',
        [t.subjectId, 'A', t.day, t.start, t.end, t.room]
      );
    }
    console.log('✅ Timetable seeded');

    // 11. Create Events
    await client.query(
      'INSERT INTO events (title, date, description, created_by) VALUES ($1, $2, $3, $4)',
      ['Annual Tech Fest 2026', '2026-05-15', 'Annual technology festival with hackathons, workshops, and tech talks. All departments participate.', userIds['admin@demo.com']]
    );
    await client.query(
      'INSERT INTO events (title, date, description, created_by) VALUES ($1, $2, $3, $4)',
      ['Mid-Semester Exam Week', '2026-04-28', 'Mid-semester examinations for all departments. Check your hall tickets for schedule.', userIds['admin@demo.com']]
    );
    console.log('✅ Events seeded');

    // 12. Hall Ticket Rules
    await client.query(
      'INSERT INTO hall_ticket_rules (min_attendance_percent, enabled) VALUES ($1, $2)',
      [75, true]
    );
    console.log('✅ Hall ticket rules seeded');

    // 13. Interventions
    await client.query(
      'INSERT INTO interventions (student_id, mentor_id, type, remarks) VALUES ($1, $2, $3, $4)',
      [studentIds['liam@demo.com'], userIds['mentor@demo.com'], 'counseling', 'Student has been consistently missing classes. Scheduled a one-on-one counseling session to discuss academic challenges.']
    );
    await client.query(
      'INSERT INTO interventions (student_id, mentor_id, type, remarks) VALUES ($1, $2, $3, $4)',
      [studentIds['noah@demo.com'], userIds['mentor@demo.com'], 'remedial', 'Arranged remedial classes for Mathematics and Physics. Student needs extra support in these subjects.']
    );
    await client.query(
      'INSERT INTO interventions (student_id, mentor_id, type, remarks) VALUES ($1, $2, $3, $4)',
      [studentIds['student@demo.com'], userIds['mentor@demo.com'], 'counseling', 'Regular check-in. Student attendance is declining - discussed time management strategies.']
    );
    console.log('✅ Interventions seeded');

    // 14. Notifications
    const notifData = [
      { userId: userIds['student@demo.com'], message: 'Your risk level has changed to Medium. Check your risk analysis for details.' },
      { userId: userIds['student@demo.com'], message: 'New assignment posted: Data Structures Assignment 1. Deadline: April 25.' },
      { userId: userIds['student@demo.com'], message: 'Mid-Semester exams start on April 28. Download your hall ticket.' },
      { userId: userIds['mentor@demo.com'], message: 'Student Liam Chen has been flagged as High Risk.' },
      { userId: userIds['mentor@demo.com'], message: 'New intervention assigned for Noah Garcia.' },
      { userId: userIds['teacher@demo.com'], message: '3 new assignment submissions received for CS201.' },
    ];
    for (const n of notifData) {
      await client.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [n.userId, n.message]
      );
    }
    console.log('✅ Notifications seeded');

    await client.query('COMMIT');
    console.log('\n🎉 All seed data inserted successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   student@demo.com  / Demo@1234');
    console.log('   mentor@demo.com   / Demo@1234');
    console.log('   teacher@demo.com  / Demo@1234');
    console.log('   admin@demo.com    / Demo@1234');
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
