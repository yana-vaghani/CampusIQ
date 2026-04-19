const axios = require('axios');

const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
const GROK_API_KEY = process.env.GROK_API_KEY || '';
const MODEL = 'grok-3-mini';

/**
 * Call Grok LLM with a prompt
 */
async function callGrok(systemPrompt, userPrompt) {
  if (!GROK_API_KEY) {
    return null; // fallback to rule-based
  }
  try {
    const response = await axios.post(
      GROK_API_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      },
      {
        headers: {
          Authorization: `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Grok API error:', err.message);
    return null;
  }
}

/**
 * Generate student risk insights via LLM
 * Uses ML feature_weights.json approach from Extra/
 */
async function getStudentInsights(riskData, studentName) {
  const { breakdown, score, level, reasons } = riskData;
  const weights = { attendance: 35.82, marks: 31.35, assignment: 20.89, lms: 11.94 };

  const systemPrompt = `You are an academic advisor AI for a college platform called CampusIQ. 
Provide concise, actionable, empathetic academic insights for students in 2-4 bullet points.
Format each bullet starting with an emoji. Keep language encouraging but honest.
Return ONLY the bullet points, no preamble.`;

  const userPrompt = `Student Risk Report for ${studentName}:
Risk Score: ${score}/100 (${level.toUpperCase()} risk)
Attendance: ${breakdown.attendancePercent}% (weight: ${weights.attendance}%)
Average Marks: ${breakdown.averageMarks}/100 (weight: ${weights.marks}%)  
Assignment Completion: ${breakdown.assignmentCompletion}% (weight: ${weights.assignment}%)
LMS Activity: ${breakdown.lmsActivity || 'N/A'}% (weight: ${weights.lms}%)
Contributing factors: ${reasons.join('; ')}

Explain why this student is at risk and provide 3-4 specific, actionable improvement suggestions.`;

  const llmResponse = await callGrok(systemPrompt, userPrompt);
  return llmResponse;
}

/**
 * Generate mentor intervention suggestions via LLM
 */
async function getMentorInterventionSuggestions(studentData) {
  const { name, riskScore, riskLevel, attendance, avgMarks, assignmentCompletion, existingInterventions } = studentData;

  const systemPrompt = `You are an experienced academic counseling advisor for a university. 
Generate specific, practical intervention recommendations for faculty mentors.
Return exactly 3 intervention suggestions, each starting with a type tag like [COUNSELING], [REMEDIAL], or [ASSIGNMENT].
Keep each suggestion to 1-2 sentences. Be specific and actionable.`;

  const userPrompt = `Student: ${name}
Risk Score: ${riskScore}/100 (${riskLevel} risk)
Attendance: ${attendance}%
Average Marks: ${avgMarks}/100
Assignment Completion: ${assignmentCompletion}%
Previous interventions: ${existingInterventions || 'None'}

Suggest 3 targeted interventions for this student's mentor to take.`;

  const llmResponse = await callGrok(systemPrompt, userPrompt);
  return llmResponse;
}

/**
 * Fallback rule-based insights when LLM is unavailable
 */
function getRuleBasedInsights(riskData) {
  const { breakdown, level } = riskData;
  const bullets = [];

  if (breakdown.attendancePercent < 75) {
    bullets.push(`📅 Your attendance (${breakdown.attendancePercent}%) is below the required 75%. Attend all scheduled classes — each session matters for your eligibility.`);
  }
  if (breakdown.averageMarks < 50) {
    bullets.push(`📚 Your average marks (${breakdown.averageMarks}/100) need improvement. Visit faculty during office hours and focus on understanding core concepts.`);
  } else if (breakdown.averageMarks < 65) {
    bullets.push(`📖 Your marks (${breakdown.averageMarks}/100) are average. Review previous exam papers and practice more problems to push into a higher grade bracket.`);
  }
  if (breakdown.assignmentCompletion < 75) {
    bullets.push(`✏️ Only ${breakdown.assignmentCompletion}% of assignments are complete. Submit pending work immediately — assignments directly affect your internal marks.`);
  }
  if (level === 'high') {
    bullets.push(`🆘 Your risk level is HIGH. Please meet your faculty mentor this week for a personal academic support session.`);
  } else if (level === 'low') {
    bullets.push(`🌟 Great performance! Keep it up. Consider helping peers with study groups to reinforce your own learning.`);
  }
  return bullets.join('\n');
}

/**
 * Fallback rule-based intervention suggestions
 */
function getRuleBasedInterventions(studentData) {
  const { riskLevel, attendance, avgMarks, assignmentCompletion } = studentData;
  const suggestions = [];

  if (attendance < 75) {
    suggestions.push('[COUNSELING] Schedule an attendance counseling session to understand why the student is missing classes and create an attendance improvement plan.');
  }
  if (avgMarks < 50) {
    suggestions.push('[REMEDIAL] Arrange subject-specific remedial classes focusing on topics where the student scored below 35%, especially Mathematics and core subjects.');
  }
  if (assignmentCompletion < 60) {
    suggestions.push('[ASSIGNMENT] Grant a one-week extension for pending assignments and schedule a 30-minute check-in to review submission quality together.');
  }
  if (riskLevel === 'high') {
    suggestions.push('[COUNSELING] Initiate a parent-mentor meeting to discuss the student\'s academic situation and coordinate a home support strategy.');
  }
  return suggestions.join('\n');
}

module.exports = {
  getStudentInsights,
  getMentorInterventionSuggestions,
  getRuleBasedInsights,
  getRuleBasedInterventions,
};
