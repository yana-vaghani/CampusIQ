import { useState, useEffect } from 'react';
import { getTimetable } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Clock, MapPin } from 'lucide-react';
import { formatTime, getDayOfWeek } from '../../utils/formatDate';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const dayColors = ['#1B263B','#415A77','#354F52','#FFC300','#A4161A'];

export default function StudentSchedule() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [view, setView] = useState('today');
  const today = getDayOfWeek();

  useEffect(() => {
    getTimetable(user.section || 'A').then(r => setTimetable(r.data));
  }, []);

  const filtered = view === 'today' ? timetable.filter(t => t.day === today) : timetable;
  const grouped = DAYS.reduce((acc, d) => { acc[d] = filtered.filter(t => t.day === d); return acc; }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Schedule</h1>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['today', 'week'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === v ? 'bg-white shadow-sm text-[#1B263B]' : 'text-gray-500'}`}>
              {v === 'today' ? 'Today' : 'Week'}
            </button>
          ))}
        </div>
      </div>
      {view === 'today' ? (
        <div className="space-y-3">
          {filtered.length === 0 ? <p className="text-center text-gray-400 py-12">No classes today! 🎉</p> : filtered.map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 card-hover">
              <div className="w-1.5 h-14 rounded-full" style={{ backgroundColor: dayColors[i % 5] }} />
              <div className="flex-1">
                <p className="font-semibold text-[#1B263B]">{t.subject_name}</p>
                <p className="text-sm text-gray-500">{t.subject_code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#1B263B] flex items-center gap-1"><Clock size={14} /> {formatTime(t.start_time)} - {formatTime(t.end_time)}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 justify-end"><MapPin size={12} /> {t.room_number}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {DAYS.map((day, di) => grouped[day]?.length > 0 && (
            <div key={day}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${day === today ? 'text-[#1B263B]' : 'text-gray-500'}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dayColors[di] }} /> {day}
                {day === today && <span className="text-xs bg-[#354F52] text-white px-2 py-0.5 rounded-full">Today</span>}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[day].map((t, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 card-hover">
                    <p className="font-medium text-sm text-[#1B263B]">{t.subject_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(t.start_time)} - {formatTime(t.end_time)} • {t.room_number}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
