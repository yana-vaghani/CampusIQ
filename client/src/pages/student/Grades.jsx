import { useState, useEffect } from 'react';
import { getStudentMarks, getStudentMe, getStudentAssignments } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Award, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';

const gradeFromPct = (pct) => {
  if (pct >= 90) return { grade: 'O', label: 'Outstanding', color: '#22c55e' };
  if (pct >= 75) return { grade: 'A+', label: 'Excellent', color: '#3b82f6' };
  if (pct >= 60) return { grade: 'A', label: 'Very Good', color: '#6366f1' };
  if (pct >= 50) return { grade: 'B', label: 'Good', color: '#8b5cf6' };
  if (pct >= 40) return { grade: 'C', label: 'Average', color: '#f59e0b' };
  if (pct >= 35) return { grade: 'P', label: 'Pass', color: '#f97316' };
  return { grade: 'F', label: 'Fail', color: '#ef4444' };
};

export default function StudentGrades() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const studentId = user?.studentId;

  useEffect(() => {
    if (!studentId) return;
    Promise.allSettled([
      getStudentMarks(studentId),
      getStudentAssignments(studentId),
    ]).then(([marksRes, assignRes]) => {
      if (marksRes.status === 'fulfilled') setMarks(marksRes.value.data);
      if (assignRes.status === 'fulfilled') {
        const d = assignRes.value.data;
        setAssignments(d.all || d || []);
      }
      setLoading(false);
    });
  }, [studentId]);

  const computed = marks.map(m => {
    const mid = parseFloat(m.mid_marks) || 0;
    const internal = parseFloat(m.internal_marks) || 0;
    const ia = parseFloat(m.ia_marks) || 0;
    const totalInternal = mid + internal;
    const totalAll = mid + internal + ia;
    const pct = (totalInternal / 50) * 100;
    const g = gradeFromPct(pct);
    return { ...m, mid, internal, ia, totalInternal, totalAll, pct, grade: g };
  });

  // Assignment grades
  const gradedAssignments = assignments.filter(a => a.grade !== null && a.grade !== undefined);

  const avg = computed.length > 0 ? computed.reduce((s, m) => s + m.totalInternal, 0) / computed.length : 0;
  const avgPct = computed.length > 0 ? computed.reduce((s, m) => s + m.pct, 0) / computed.length : 0;
  const overallGrade = gradeFromPct(avgPct);

  const chartData = computed.map(m => ({
    name: m.subject_code || m.subject_name?.slice(0, 6),
    'Mid Sem': m.mid,
    'Internal': m.internal,
    'IA': m.ia,
  }));

  // Grade distribution pie
  const gradeCounts = {};
  computed.forEach(m => { gradeCounts[m.grade.grade] = (gradeCounts[m.grade.grade] || 0) + 1; });
  const pieData = Object.entries(gradeCounts).map(([g, count]) => ({
    name: g, value: count, color: gradeFromPct(g === 'O' ? 90 : g === 'A+' ? 75 : g === 'A' ? 60 : g === 'B' ? 50 : g === 'C' ? 40 : g === 'P' ? 35 : 0).color
  }));

  if (loading) return <div className="space-y-3 animate-pulse">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-100 rounded-xl"/>)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Grades & Marks</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#1B263B] to-[#415A77] text-white rounded-xl p-5">
          <p className="text-sm opacity-75">Overall Average</p>
          <p className="text-4xl font-bold mt-1">{avg.toFixed(1)}<span className="text-lg opacity-70">/50</span></p>
          <p className="mt-1 text-sm" style={{ color: overallGrade.color + 'dd' }}>Grade {overallGrade.grade} — {overallGrade.label}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Percentage</p>
          <p className="text-3xl font-bold text-[#1B263B] mt-1">{avgPct.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">Internal Assessment</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Subjects</p>
          <p className="text-3xl font-bold text-[#1B263B] mt-1">{marks.length}</p>
          <p className="text-xs text-gray-400 mt-1">Current Semester</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Top Subject</p>
          {computed.length > 0 ? (
            <>
              <p className="text-base font-bold text-[#1B263B] mt-1">{[...computed].sort((a,b)=>b.totalInternal-a.totalInternal)[0]?.subject_name}</p>
              <p className="text-xs text-gray-400 mt-1">{[...computed].sort((a,b)=>b.totalInternal-a.totalInternal)[0]?.totalInternal.toFixed(1)}/50</p>
            </>
          ) : <p className="text-sm text-gray-400 mt-2">No data</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-3 flex items-center gap-2"><TrendingUp size={16} /> Marks Comparison</h3>
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={14} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 25]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Mid Sem" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="Internal" fill="#8b5cf6" radius={[3,3,0,0]} />
                  <Bar dataKey="IA" fill="#f59e0b" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {[{c:'#3b82f6',l:'Mid Sem (/25)'},{c:'#8b5cf6',l:'Internal (/25)'},{c:'#f59e0b',l:'IA (/25)'}].map(d=>(
                  <span key={d.l} className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full inline-block" style={{background:d.c}} />{d.l}
                  </span>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-gray-400 py-10 text-center">No marks data</p>}
        </div>

        {/* Grade Distribution Pie */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-[#1B263B] mb-3 flex items-center gap-2"><Award size={16} /> Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Subject Table — Detailed Marks Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-[#1B263B] flex items-center gap-2"><BookOpen size={16} /> Subject-wise Marks Breakdown</h3>
          <p className="text-xs text-gray-400 mt-0.5">End-semester exam not yet conducted — showing internal assessment only</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Subject</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Mid Sem<br/><span className="text-[10px] font-normal">/25</span></th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Internal<br/><span className="text-[10px] font-normal">/25</span></th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">IA<br/><span className="text-[10px] font-normal">/25</span></th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Total<br/><span className="text-[10px] font-normal">/50</span></th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">%</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Grade</th>
            </tr></thead>
            <tbody>
              {computed.map((m, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#1B263B]">{m.subject_name}</p>
                    <p className="text-xs text-gray-400">{m.subject_code}</p>
                  </td>
                  <td className="py-3 px-4 text-center">{m.mid.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center">{m.internal.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center">{m.ia.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#1B263B]">{m.totalInternal.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium ${m.pct >= 60 ? 'text-green-600' : m.pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {m.pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: m.grade.color + '20', color: m.grade.color }}>
                      {m.grade.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Grades */}
      {gradedAssignments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#1B263B] flex items-center gap-2"><CheckCircle size={16} /> Assignment Grades</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Assignment</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Subject</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Grade</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Remarks</th>
              </tr></thead>
              <tbody>
                {gradedAssignments.map((a, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-[#1B263B]">{a.title}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{a.subject_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">{a.grade}/100</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{a.grade_remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {marks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Award size={40} className="mx-auto mb-3 opacity-30" />
          <p>No marks data available</p>
        </div>
      )}
    </div>
  );
}
