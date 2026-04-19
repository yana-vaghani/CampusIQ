import { useState, useEffect, useCallback } from 'react';
import { getStudentAttendance, getStudentMe } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// Calendar helpers
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function AttendanceCalendar({ records, subjectName }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });

  const dateMap = {};
  records.forEach(r => {
    const d = r.date.split('T')[0];
    dateMap[d] = r.status;
  });

  const daysInMonth = getDaysInMonth(current.year, current.month);
  const firstDay = getFirstDayOfMonth(current.year, current.month);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const key = (d) => `${current.year}-${String(current.month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[#1B263B]">{subjectName}</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrent(c => {
            const d = new Date(c.year, c.month - 1); return { year: d.getFullYear(), month: d.getMonth() };
          })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded">‹</button>
          <span className="text-xs text-gray-600">{MONTHS[current.month]} {current.year}</span>
          <button onClick={() => setCurrent(c => {
            const d = new Date(c.year, c.month + 1); return { year: d.getFullYear(), month: d.getMonth() };
          })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] text-gray-400 font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const k = key(d);
          const status = dateMap[k];
          return (
            <div key={k} title={status || 'no record'}
              className={`aspect-square flex items-center justify-center rounded text-[11px] font-medium
                ${status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                  status === 'absent' ? 'bg-red-100 text-red-600' : 'text-gray-400'}`}>
              {d}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2">
        <span className="text-[10px] text-gray-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Present</span>
        <span className="text-[10px] text-gray-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Absent</span>
      </div>
    </div>
  );
}

export default function StudentAttendance() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const studentId = user?.studentId;

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudentAttendance(studentId, selectedSubject)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId, selectedSubject]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
    </div>
  );

  const subjects = data?.subjectStats || [];
  const allRecords = data?.records || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Per-subject breakdown with calendar view</p>
      </div>

      {/* Overall Summary */}
      <div className="bg-gradient-to-r from-[#1B263B] to-[#415A77] rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-75">Overall Attendance</p>
            <p className="text-4xl font-bold mt-1">{data?.summary?.percent || 0}%</p>
            <p className="text-sm opacity-75 mt-1">{data?.summary?.present} present / {data?.summary?.total} total</p>
          </div>
          <div className="w-20 h-20 relative">
            <svg viewBox="0 0 36 36" className="rotate-[-90deg] w-full h-full">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3"
                strokeDasharray={`${data?.summary?.percent || 0} 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {data?.summary?.percent || 0}%
            </span>
          </div>
        </div>
        {(data?.summary?.percent || 0) < 75 && (
          <div className="mt-3 bg-red-500/20 rounded-lg p-2 text-sm">
            ⚠️ Attendance below 75% — you may not be eligible for hall ticket
          </div>
        )}
      </div>

      {/* Subject Cards */}
      <div>
        <h3 className="text-base font-semibold text-[#1B263B] mb-3">Per Subject</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(sub => {
            const pct = sub.percent || 0;
            const color = pct >= 75 ? '#4CAF50' : pct >= 60 ? '#FF9800' : '#f44336';
            const bg = pct >= 75 ? 'bg-emerald-50 border-emerald-200' : pct >= 60 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
            return (
              <button key={sub.id} onClick={() => setSelectedSubject(selectedSubject === sub.id ? null : sub.id)}
                className={`text-left rounded-xl p-4 border transition-all ${bg} ${selectedSubject === sub.id ? 'ring-2 ring-[#1B263B]' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#1B263B] text-sm">{sub.name}</p>
                    <p className="text-xs text-gray-500">{sub.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color }}>{pct}%</p>
                    <p className="text-xs text-gray-500">{sub.present}/{sub.total}</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar for selected subject */}
      {selectedSubject && (
        <div>
          <h3 className="text-base font-semibold text-[#1B263B] mb-3">
            Calendar — {subjects.find(s => s.id === selectedSubject)?.name}
          </h3>
          <AttendanceCalendar
            records={allRecords.filter(r => r.subject_id === selectedSubject)}
            subjectName={subjects.find(s => s.id === selectedSubject)?.name || ''}
          />
        </div>
      )}

      {/* All Calendars */}
      {!selectedSubject && subjects.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-[#1B263B] mb-3">Monthly Calendars</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map(sub => (
              <AttendanceCalendar
                key={sub.id}
                records={allRecords.filter(r => r.subject_id === sub.id)}
                subjectName={sub.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
