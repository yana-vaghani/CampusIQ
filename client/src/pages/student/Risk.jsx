import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentRisk } from '../../api/axios';
import RiskBadge from '../../components/shared/RiskBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle } from 'lucide-react';

export default function StudentRisk() {
  const { user } = useAuth();
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentRisk(user.studentId).then(r => setRisk(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse bg-white rounded-xl h-96" />;

  const breakdownData = [
    { name: 'Attendance', value: risk?.breakdown?.attendancePercent || 0, fill: '#415A77' },
    { name: 'Marks', value: risk?.breakdown?.averageMarks || 0, fill: '#354F52' },
    { name: 'Assignments', value: risk?.breakdown?.assignmentCompletion || 0, fill: '#1B263B' },
  ];

  const trendData = (risk?.trend?.length > 0 ? risk.trend : [{score:risk?.score||50},{score:(risk?.score||50)-5},{score:(risk?.score||50)+3},{score:(risk?.score||50)-2},{score:(risk?.score||50)+7},{score:risk?.score||50}]).map((t,i) => ({ week: `W${i+1}`, score: t.score }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Risk Analysis</h1>
        <RiskBadge level={risk?.level} score={risk?.score} size="lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4">Risk Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={breakdownData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0,100]} />
              <YAxis dataKey="name" type="category" width={90} />
              <Tooltip />
              <Bar dataKey="value" radius={[0,4,4,0]} barSize={24}>
                {breakdownData.map((e,i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4">Risk Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" />
              <YAxis domain={[0,100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#1B263B" strokeWidth={2} dot={{ fill: '#1B263B', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-[#FFC300]" />Risk Factors</h3>
        {risk?.reasons?.length > 0 ? (
          <ol className="space-y-3">{risk.reasons.map((r,i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-red-50 text-[#A4161A] text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
              <span className="text-sm text-gray-700">{r}</span>
            </li>
          ))}</ol>
        ) : <p className="text-sm text-gray-500">No risk factors! 🎉</p>}
      </div>
      {risk?.subjectBreakdown && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4">Subject Analysis</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500">Subject</th>
              <th className="text-left py-3 px-4 text-gray-500">Attendance</th>
              <th className="text-left py-3 px-4 text-gray-500">Marks</th>
            </tr></thead>
            <tbody>{risk.subjectBreakdown.map((s,i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium">{s.subject}</td>
                <td className="py-3 px-4">{s.attendance.toFixed(1)}%</td>
                <td className="py-3 px-4">{s.totalMarks.toFixed(1)}/100</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
