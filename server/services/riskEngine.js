const pool = require('../db/pool');
const path = require('path');
const featureWeights = require(path.join(__dirname, '..', '..', 'Extra', 'feature_weights.json'));

/**
 * CampusIQ Risk Engine v2
 * Uses ML feature weights from Extra/feature_weights.json
 * Weights: attendance: 35.82, marks: 31.35, assignment: 20.89, lms: 11.94
 */

const W = featureWeights; // { attendance, marks, assignment, lms }
const TOTAL_WEIGHT = W.attendance + W.marks + W.assignment + W.lms;

async function computeRisk(studentId) {
  const reasons = [];

  // 1. Attendance — per subject
  const attendanceResult = await pool.query(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'present') as present,
      COUNT(*) as total
     FROM attendance WHERE student_id = $1`,
    [studentId]
  );
  const { present, total } = attendanceResult.rows[0];
  const attendancePercent = total > 0 ? (parseInt(present) / parseInt(total)) * 100 : 100;

  // 2. Marks — mid + internal only (no end-sem)
  const marksResult = await pool.query(
    `SELECT mid_marks, internal_marks FROM marks WHERE student_id = $1`,
    [studentId]
  );
  let avgTotal = 0;
  if (marksResult.rows.length > 0) {
    const totals = marksResult.rows.map(m => parseFloat(m.mid_marks) + parseFloat(m.internal_marks));
    avgTotal = totals.reduce((a, b) => a + b, 0) / totals.length;
    // Normalize to 100 (out of 50 total: mid 25 + internal 25)
    avgTotal = (avgTotal / 50) * 100;
  }

  // 3. Assignment completion
  const assignmentResult = await pool.query(
    `SELECT 
      COUNT(*) FILTER (WHERE status IN ('submitted','late')) as completed,
      COUNT(*) as total
     FROM submissions WHERE student_id = $1`,
    [studentId]
  );
  const completedAssignments = parseInt(assignmentResult.rows[0].completed);
  const totalAssignments = parseInt(assignmentResult.rows[0].total);
  const completionPercent = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 100;

  // 4. LMS activity (normalize 0-100 based on logins/views in last 30 days — proxy via submission activity)
  const lmsActivity = Math.min(100, completionPercent * 0.8 + attendancePercent * 0.2);

  // --- ML-weighted score calculation ---
  // For each factor: normalize to 0-1, then penalty = weight * (1 - normalized_value)
  // risk_score = 100 - sum_of_penalties
  const norm = (v) => Math.max(0, Math.min(1, v / 100));

  const attendancePenalty = W.attendance * (1 - norm(attendancePercent));
  const marksPenalty = W.marks * (1 - norm(avgTotal));
  const assignmentPenalty = W.assignment * (1 - norm(completionPercent));
  const lmsPenalty = W.lms * (1 - norm(lmsActivity));

  const totalPenalty = attendancePenalty + marksPenalty + assignmentPenalty + lmsPenalty;
  // Scale penalty to 100 range
  let score = Math.round(100 - (totalPenalty / TOTAL_WEIGHT) * 100);
  score = Math.max(0, Math.min(100, score));

  // --- Reasons (explainability) ---
  if (attendancePercent < 60) {
    reasons.push(`Critical attendance (${attendancePercent.toFixed(1)}%) — below 60% threshold`);
  } else if (attendancePercent < 75) {
    reasons.push(`Low attendance (${attendancePercent.toFixed(1)}%) — below 75% required`);
  } else if (attendancePercent < 80) {
    reasons.push(`Attendance slightly below target (${attendancePercent.toFixed(1)}%)`);
  }

  if (avgTotal < 35) {
    reasons.push(`Very low internal marks average (${avgTotal.toFixed(1)}%) — failing`);
  } else if (avgTotal < 50) {
    reasons.push(`Below average internal marks (${avgTotal.toFixed(1)}%)`);
  } else if (avgTotal < 65) {
    reasons.push(`Marks can improve (${avgTotal.toFixed(1)}%)`);
  }

  if (completionPercent < 50) {
    reasons.push(`Low assignment submission (${completionPercent.toFixed(0)}%) — ${totalAssignments - completedAssignments} missing`);
  } else if (completionPercent < 75) {
    reasons.push(`Assignment completion needs improvement (${completionPercent.toFixed(0)}%)`);
  }

  // Level
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
      lmsActivity: parseFloat(lmsActivity.toFixed(1)),
      weights: {
        attendance: W.attendance,
        marks: W.marks,
        assignment: W.assignment,
        lms: W.lms,
      },
      penalties: {
        attendance: parseFloat(attendancePenalty.toFixed(2)),
        marks: parseFloat(marksPenalty.toFixed(2)),
        assignment: parseFloat(assignmentPenalty.toFixed(2)),
        lms: parseFloat(lmsPenalty.toFixed(2)),
      }
    }
  };
}

function generateSuggestions(riskData) {
  const suggestions = [];
  const { breakdown, level } = riskData;

  if (breakdown.attendancePercent < 75) {
    suggestions.push({
      icon: '📅',
      text: `Attend all upcoming classes to improve from ${breakdown.attendancePercent}% to the required 75%.`,
      priority: 'high'
    });
  }
  if (breakdown.averageMarks < 50) {
    suggestions.push({ icon: '📚', text: 'Focus on your weakest subject. Visit faculty during office hours.', priority: 'high' });
  } else if (breakdown.averageMarks < 65) {
    suggestions.push({ icon: '📖', text: 'Review past papers and focus on end-semester preparation.', priority: 'medium' });
  }
  if (breakdown.assignmentCompletion < 75) {
    suggestions.push({ icon: '✏️', text: 'Submit pending assignments immediately — they impact internal marks.', priority: 'high' });
  }
  if (level === 'low') {
    suggestions.push({ icon: '🌟', text: 'Great job! Maintain your performance. Consider helping peers.', priority: 'low' });
  }
  if (level === 'high') {
    suggestions.push({ icon: '🆘', text: 'Contact your faculty mentor for personalized guidance immediately.', priority: 'high' });
  }
  return suggestions;
}

async function saveRiskSnapshot(studentId, riskData) {
  await pool.query(
    `INSERT INTO risk_scores (student_id, score, level, reasons) VALUES ($1, $2, $3, $4)`,
    [studentId, riskData.score, riskData.level, riskData.reasons]
  );
}

async function getRiskTrend(studentId) {
  const result = await pool.query(
    `SELECT score, level, computed_at FROM risk_scores 
     WHERE student_id = $1 
     ORDER BY computed_at DESC LIMIT 6`,
    [studentId]
  );
  return result.rows.reverse();
}

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
