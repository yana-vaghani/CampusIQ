const cron = require('node-cron');
const pool = require('../db/pool');
const { computeAllRisks } = require('./riskEngine');
const { sendClassReminder, sendNotification } = require('./socketService');

function startScheduler(io) {
  // Daily risk computation at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running daily risk computation...');
    try {
      const results = await computeAllRisks();
      // Send alerts for high-risk students
      for (const r of results) {
        if (r.level === 'high') {
          const student = await pool.query(
            `SELECT u.id as user_id, u.name FROM students s 
             JOIN users u ON s.user_id = u.id WHERE s.id = $1`,
            [r.studentId]
          );
          if (student.rows[0]) {
            sendNotification(io, student.rows[0].user_id, {
              message: `⚠️ Your risk level is HIGH (Score: ${r.score}). Check your dashboard for details.`,
            });
            // Notify mentor
            const mentor = await pool.query(
              `SELECT mentor_id FROM students WHERE id = $1`,
              [r.studentId]
            );
            if (mentor.rows[0]?.mentor_id) {
              sendNotification(io, mentor.rows[0].mentor_id, {
                message: `🔴 Student ${student.rows[0].name} is flagged as HIGH RISK (Score: ${r.score}).`,
              });
            }
          }
        }
      }
      console.log(`✅ Risk computation complete. ${results.length} students processed.`);
    } catch (err) {
      console.error('❌ Scheduled risk computation failed:', err.message);
    }
  });

  // Class reminder - runs every minute, checks for classes starting in 10 minutes
  cron.schedule('* * * * *', async () => {
    try {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const now = new Date();
      const today = days[now.getDay()];
      const tenMinutesLater = new Date(now.getTime() + 10 * 60000);
      const timeStr = `${String(tenMinutesLater.getHours()).padStart(2, '0')}:${String(tenMinutesLater.getMinutes()).padStart(2, '0')}`;

      const classes = await pool.query(
        `SELECT t.*, s.name as subject_name FROM timetable t 
         JOIN subjects s ON t.subject_id = s.id 
         WHERE t.day = $1 AND t.start_time = $2`,
        [today, timeStr]
      );

      for (const cls of classes.rows) {
        // Find students in this section
        const students = await pool.query(
          `SELECT s.id, u.id as user_id FROM students s 
           JOIN users u ON s.user_id = u.id 
           WHERE s.section = $1`,
          [cls.section]
        );
        for (const st of students.rows) {
          sendClassReminder(io, st.user_id, {
            message: `📚 ${cls.subject_name} starts in 10 minutes`,
            subject: cls.subject_name,
            room: cls.room_number,
          });
        }
      }
    } catch (err) {
      // Silently handle - this runs every minute
    }
  });

  console.log('⏰ Scheduler started (risk computation at 2 AM, class reminders every minute)');
}

module.exports = { startScheduler };
