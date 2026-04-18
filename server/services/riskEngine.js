const pool = require('../db/pool');

/**
 * CampusIQ Risk Engine
 * Computes risk score for a student based on:
 * - Attendance (40% weight)
 * - Marks (35% weight)
 * - Assignment Completion (25% weight)
 * 
 * Score starts at 100, penalties subtracted
 * 0-40 = High Risk, 41-70 = Medium Risk, 71-100 = Low Risk
 */

async function computeRisk(studentId) {
  let score = 100;
  const reasons = [];

  // 1. Attendance Calculation
  const attendanceResult = await pool.query(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'present') as present,
      COUNT(*) as total
     FROM attendance WHERE student_id = $1`,
    [studentId]
  );
  
  const { present, total } = attendanceResult.rows[0];
  const attendancePercent = total > 0 ? (parseInt(present) / parseInt(total)) * 100 : 100;

  if (attendancePercent < 60) {
    score -= 40;
    reasons.push(`Very low attendance (${attendancePercent.toFixed(1)}%) — below 60% threshold`);
  } else if (attendancePercent < 75) {
    score -= 20;
    reasons.push(`Low attendance (${attendancePercent.toFixed(1)}%) — below 75% required`);
  } else if (attendancePercent < 80) {
    score -= 10;
    reasons.push(`Attendance slightly below target (${attendancePercent.toFixed(1)}%)`);
  }

  // 2. Marks Calculation
  const marksResult = await pool.query(
    `SELECT mid_marks, internal_marks, endsem_marks FROM marks WHERE student_id = $1`,
    [studentId]
  );

  let avgTotal = 0;
  if (marksResult.rows.length > 0) {
    const totals = marksResult.rows.map(m => 
      parseFloat(m.mid_marks) + parseFloat(m.internal_marks) + (parseFloat(m.endsem_marks) / 2)
    );
    avgTotal = totals.reduce((a, b) => a + b, 0) / totals.length;
  }

  if (avgTotal < 35) {
    score -= 35;
    reasons.push(`Very low average marks (${avgTotal.toFixed(1)}/100) — failing grade`);
  } else if (avgTotal < 50) {
    score -= 20;
    reasons.push(`Below average marks (${avgTotal.toFixed(1)}/100)`);
  } else if (avgTotal < 65) {
    score -= 10;
    reasons.push(`Average marks could improve (${avgTotal.toFixed(1)}/100)`);
  }

  // 3. Assignment Completion
  const assignmentResult = await pool.query(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'submitted') as completed,
      COUNT(*) as total
     FROM submissions WHERE student_id = $1`,
    [studentId]
  );

  const completedAssignments = parseInt(assignmentResult.rows[0].completed);
  const totalAssignments = parseInt(assignmentResult.rows[0].total);
  const completionPercent = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 100;

  if (completionPercent < 50) {
    score -= 25;
    reasons.push(`Low assignment completion (${completionPercent.toFixed(0)}%) — ${totalAssignments - completedAssignments} missing`);
  } else if (completionPercent < 75) {
    score -= 15;
    reasons.push(`Assignment completion needs improvement (${completionPercent.toFixed(0)}%)`);
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level;
  if (score <= 40) level = 'high';
  else if (score <= 70) level = 'medium';
  else level = 'low';

  return {
    score,
    level,
    reasons,
    breakdown: {
      attendancePercent: parseFloat(attendancePercent.toFixed(1)),
      averageMarks: parseFloat(avgTotal.toFixed(1)),
      assignmentCompletion: parseFloat(completionPercent.toFixed(1)),
    }
  };
}

/**
 * Generate AI-like suggestions based on risk factors
 */
function generateSuggestions(riskData) {
  const suggestions = [];
  const { breakdown, level, reasons } = riskData;

  if (breakdown.attendancePercent < 75) {
    suggestions.push({
      icon: '📅',
      text: `Attend all upcoming classes to improve your attendance from ${breakdown.attendancePercent}% to the required 75%. Each class counts!`,
      priority: 'high'
    });
  }

  if (breakdown.averageMarks < 50) {
    suggestions.push({
      icon: '📚',
      text: `Focus on your weakest subject. Consider visiting faculty office hours and forming study groups to improve your marks.`,
      priority: 'high'
    });
  } else if (breakdown.averageMarks < 65) {
    suggestions.push({
      icon: '📖',
      text: `You're close to a good grade range. Review past papers and focus on end-semester preparation to boost your scores.`,
      priority: 'medium'
    });
  }

  if (breakdown.assignmentCompletion < 75) {
    suggestions.push({
      icon: '✏️',
      text: `Submit pending assignments immediately. Late submissions affect your overall score significantly.`,
      priority: 'high'
    });
  }

  if (level === 'low') {
    suggestions.push({
      icon: '🌟',
      text: `Great job! Maintain your current performance. Consider mentoring peers who might need help.`,
      priority: 'low'
    });
  }

  if (level === 'high') {
    suggestions.push({
      icon: '🆘',
      text: `Contact your faculty mentor for personalized guidance. Early intervention can significantly improve your academic standing.`,
      priority: 'high'
    });
  }

  return suggestions;
}

/**
 * Save risk score snapshot to database
 */
async function saveRiskSnapshot(studentId, riskData) {
  await pool.query(
    `INSERT INTO risk_scores (student_id, score, level, reasons) VALUES ($1, $2, $3, $4)`,
    [studentId, riskData.score, riskData.level, riskData.reasons]
  );
}

/**
 * Get risk trend for a student (last 6 entries)
 */
async function getRiskTrend(studentId) {
  const result = await pool.query(
    `SELECT score, level, computed_at FROM risk_scores 
     WHERE student_id = $1 
     ORDER BY computed_at DESC LIMIT 6`,
    [studentId]
  );
  return result.rows.reverse();
}

/**
 * Compute and save risk for all students
 */
async function computeAllRisks() {
  const students = await pool.query('SELECT id FROM students');
  const results = [];
  for (const student of students.rows) {
    try {
      const risk = await computeRisk(student.id);
      await saveRiskSnapshot(student.id, risk);
      results.push({ studentId: student.id, ...risk });
    } catch (err) {
      console.error(`Error computing risk for student ${student.id}:`, err.message);
    }
  }
  return results;
}

module.exports = {
  computeRisk,
  generateSuggestions,
  saveRiskSnapshot,
  getRiskTrend,
  computeAllRisks,
};
