import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentAttendance } from '../../api/axios';
import { CalendarCheck, Info } from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentAttendance(user.studentId, filter || undefined)
      .then(r => setData(r.data)).finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <div className="animate-pulse bg-white rounded-xl h-96" />;

  const pct = data?.summary?.percent || 0;
  const needed = pct < 75 ? Math.ceil((0.75 * data.summary.total - data.summary.present) / (1 - 0.75)) : 0;
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Attendance</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
          <svg width="160" height="160" className="mb-4">
            <circle cx="80" cy="80" r="60" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle cx="80" cy="80" r="60" fill="none" stroke={pct >= 75 ? '#354F52' : pct >= 60 ? '#FFC300' : '#A4161A'} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 80 80)" className="transition-all duration-1000" />
            <text x="80" y="75" textAnchor="middle" className="text-2xl font-bold" fill="#1B263B">{pct.toFixed(1)}%</text>
            <text x="80" y="95" textAnchor="middle" className="text-xs" fill="#6b7280">Overall</text>
          </svg>
          <p className="text-sm text-gray-500">{data?.summary?.present}/{data?.summary?.total} classes attended</p>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1B263B]">Subject-wise Attendance</h3>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
              <option value="">All Subjects</option>
              {data?.subjectStats?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {data?.subjectStats?.map(s => (
            <div key={s.id} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-[#1B263B]">{s.name} ({s.code})</span>
                <span className={s.percent >= 75 ? 'text-[#354F52]' : 'text-[#A4161A]'}>{s.percent}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.percent}%`, backgroundColor: s.percent >= 75 ? '#354F52' : s.percent >= 60 ? '#FFC300' : '#A4161A' }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{s.present}/{s.total} classes</p>
            </div>
          ))}
        </div>
      </div>
      {needed > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Info size={20} className="text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Attendance Below Requirement</p>
            <p className="text-sm text-amber-700 mt-1">You need to attend <strong>{needed} more classes</strong> without any absences to reach the required 75% attendance.</p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Attendance Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500">Date</th>
              <th className="text-left py-3 px-4 text-gray-500">Subject</th>
              <th className="text-left py-3 px-4 text-gray-500">Status</th>
            </tr></thead>
            <tbody>{data?.records?.slice(0, 30).map((r, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-2 px-4">{new Date(r.date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{r.subject_name}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'present' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
