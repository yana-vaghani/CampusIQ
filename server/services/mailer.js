const nodemailer = require('nodemailer');

let transporter = null;

function initMailer() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('📧 Mailer initialized');
  } else {
    console.log('📧 Mailer not configured (SMTP credentials missing)');
  }
}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log(`📧 [Mock] Email to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"CampusIQ" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

async function sendAttendanceAlert(studentEmail, studentName, attendancePercent) {
  await sendEmail(
    studentEmail,
    'CampusIQ: Low Attendance Alert',
    `<h2>Attendance Alert</h2>
     <p>Dear ${studentName},</p>
     <p>Your overall attendance has dropped to <strong>${attendancePercent}%</strong>, which is below the required 75%.</p>
     <p>Please ensure regular attendance to avoid academic consequences.</p>
     <p>— CampusIQ System</p>`
  );
}

async function sendRiskAlert(studentEmail, studentName, riskLevel, score) {
  await sendEmail(
    studentEmail,
    `CampusIQ: ${riskLevel === 'high' ? '🔴' : '🟡'} Risk Level Alert`,
    `<h2>Academic Risk Alert</h2>
     <p>Dear ${studentName},</p>
     <p>Your academic risk level has been assessed as <strong style="color: ${riskLevel === 'high' ? '#A4161A' : '#FFC300'}">${riskLevel.toUpperCase()}</strong> (Score: ${score}/100).</p>
     <p>Please check your CampusIQ dashboard for detailed analysis and recommendations.</p>
     <p>— CampusIQ System</p>`
  );
}

initMailer();

module.exports = { sendEmail, sendAttendanceAlert, sendRiskAlert };
