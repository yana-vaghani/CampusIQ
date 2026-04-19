import { useState, useEffect } from 'react';
import { getStudentRisk } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Brain, AlertTriangle, TrendingUp, Sparkles, Calendar } from 'lucide-react';

const LEVEL_CONFIG = {
  high: { color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', label: 'High Risk' },
  medium: { color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Medium Risk' },
  low: { color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200', label: 'Low Risk' },
};

// Heatmap color based on score (100 = good/low risk, 0 = bad/high risk)
function heatColor(score) {
  if (score >= 70) return '#22c55e'; // Green
  if (score >= 55) return '#84cc16'; // Lime
  if (score >= 40) return '#f59e0b'; // Amber
  if (score >= 25) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

export default function StudentRisk() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const studentId = user?.studentId;

  useEffect(() => {
    if (!studentId) return;
    getStudentRisk(studentId)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  if (!data) return <div className="text-center py-20 text-gray-400">Unable to load risk data</div>;

  const cfg = LEVEL_CONFIG[data.level] || LEVEL_CONFIG.low;
  const weights = data.breakdown?.weights || { attendance: 35.82, marks: 31.35, assignment: 20.89, lms: 11.94 };

  const radarData = [
    { subject: 'Attendance', value: data.breakdown?.attendancePercent || 0, fullMark: 100 },
    { subject: 'Marks', value: data.breakdown?.averageMarks || 0, fullMark: 100 },
    { subject: 'Assignments', value: data.breakdown?.assignmentCompletion || 0, fullMark: 100 },
    { subject: 'LMS', value: data.breakdown?.lmsActivity || 0, fullMark: 100 },
  ];

  const trendData = data.trend?.map(t => ({
    date: new Date(t.computed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    score: t.score,
    level: t.level,
  })) || [];

  const factors = [
    { label: 'Attendance', value: data.breakdown?.attendancePercent, weight: weights.attendance, max: 100, unit: '%', color: '#3b82f6' },
    { label: 'Avg. Marks', value: data.breakdown?.averageMarks, weight: weights.marks, max: 100, unit: '%', color: '#8b5cf6' },
    { label: 'Assignments', value: data.breakdown?.assignmentCompletion, weight: weights.assignment, max: 100, unit: '%', color: '#f59e0b' },
    { label: 'LMS Activity', value: data.breakdown?.lmsActivity, weight: weights.lms, max: 100, unit: '%', color: '#10b981' },
  ];

  // Build heatmap data from trend (weeks × factors)
  const heatmapWeeks = trendData.map((t, i) => ({
    week: t.date,
    score: t.score,
    color: heatColor(t.score),
  }));

  // Parse LLM insights
  const llmLines = data.llmInsights ? data.llmInsights.split('\n').filter(l => l.trim()) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Risk Analysis</h1>

      {/* Score Card */}
      <div className={`rounded-xl p-6 border ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Academic Risk Score</p>
            <p className="text-6xl font-bold mt-1" style={{ color: cfg.color }}>{data.score}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium" style={{ background: cfg.color + '20', color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 36 36" className="rotate-[-90deg] w-full h-full">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={cfg.color} strokeWidth="3"
                strokeDasharray={`${data.score} 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold" style={{ color: cfg.color }}>{data.score}</span>
              <span className="text-[10px] text-gray-500">/100</span>
            </span>
          </div>
        </div>
        {data.reasons?.length > 0 && (
          <div className="mt-4 space-y-1">
            {data.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: cfg.color }} />
                {r}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Factor Breakdown */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Risk Factor Breakdown</h3>
        <p className="text-xs text-gray-400 mb-4">Weights derived from ML model (SHAP analysis)</p>
        <div className="space-y-4">
          {factors.map(f => (
            <div key={f.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{f.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">weight {f.weight.toFixed(1)}%</span>
                  <span className="font-semibold" style={{ color: f.value < 50 ? '#ef4444' : f.value < 75 ? '#f59e0b' : '#22c55e' }}>
                    {f.value?.toFixed(1)}{f.unit}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${f.value}%`, backgroundColor: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Radar Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-3">Academic Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f0f0f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Radar name="Score" dataKey="value" stroke="#1B263B" fill="#1B263B" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-3 flex items-center gap-2"><TrendingUp size={16} /> Risk Trend</h3>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val) => [`${val}/100`, 'Risk Score']} />
                <Line type="monotone" dataKey="score" stroke="#1B263B" strokeWidth={2} dot={{ r: 4, fill: '#1B263B' }}
                  activeDot={{ r: 6, fill: '#FFC300' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Not enough history yet</div>
          )}
        </div>
      </div>

      {/* Risk Heatmap */}
      {heatmapWeeks.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4 flex items-center gap-2">
            <Calendar size={16} /> Risk Heatmap (Weekly)
          </h3>
          <div className="flex gap-2 items-end flex-wrap">
            {heatmapWeeks.map((w, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="relative group">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-110 cursor-default"
                    style={{ backgroundColor: w.color }}>
                    {w.score}
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Score: {w.score}/100
                  </div>
                </div>
                <span className="text-[10px] text-gray-500">{w.week}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-[10px] text-gray-500">Low risk</span>
            <div className="flex gap-0.5">
              {['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'].map(c => (
                <div key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-[10px] text-gray-500">High risk</span>
          </div>
        </div>
      )}

      {/* LLM Insights */}
      <div className="bg-gradient-to-br from-[#1B263B] to-[#415A77] rounded-xl p-5 text-white">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Sparkles size={16} /> AI Insights & Suggestions</h3>
        {llmLines.length > 0 ? (
          <div className="space-y-2">
            {llmLines.map((line, i) => (
              <p key={i} className="text-sm opacity-90 leading-relaxed">{line}</p>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data.suggestions?.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-lg">{s.icon}</span>
                <p className="text-sm opacity-90">{s.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject-wise breakdown */}
      {data.subjectBreakdown?.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-3">Subject-Wise Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Subject</th>
                <th className="text-right py-2 text-gray-500 font-medium">Attendance</th>
                <th className="text-right py-2 text-gray-500 font-medium">Marks (Mid+IA)</th>
              </tr></thead>
              <tbody>
                {data.subjectBreakdown.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-[#1B263B] font-medium">{s.subject} <span className="text-xs text-gray-400">({s.code})</span></td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.attendance >= 75 ? 'bg-green-50 text-green-700' : s.attendance >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                        {s.attendance}%
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium text-[#1B263B]">{s.totalMarks}/50</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
