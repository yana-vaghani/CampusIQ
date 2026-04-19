import { useState, useEffect } from 'react';
import { getTimetable, getStudentMe } from '../../api/axios';
import { Clock, MapPin, Calendar, List } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const DAY_SHORT = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri' };
const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function getTodayName() {
  const day = new Date().getDay();
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day];
}

export default function StudentSchedule() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('today');
  const [section, setSection] = useState('A');

  useEffect(() => {
    getStudentMe()
      .then(r => { setSection(r.data.section || 'A'); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getTimetable(section)
      .then(r => { setTimetable(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [section]);

  const today = getTodayName();
  const todaySlots = timetable.filter(t => t.day === today).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const subjectColors = {};
  [...new Set(timetable.map(t => t.subject_name))].forEach((s, i) => { subjectColors[s] = COLORS[i % COLORS.length]; });

  if (loading) return <div className="space-y-3 animate-pulse">{[1,2,3].map(i=><div key={i} className="h-16 bg-gray-100 rounded-xl"/>)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Schedule</h1>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('today')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${view==='today' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>
              <Clock size={14} /> Today
            </button>
            <button onClick={() => setView('week')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${view==='week' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>
              <List size={14} /> Week
            </button>
          </div>
        </div>
      </div>

      {view === 'today' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[#415A77]" />
            <h3 className="font-semibold text-[#1B263B]">{today} — {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</h3>
          </div>
          {todaySlots.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400">No classes today{['Saturday','Sunday'].includes(today) ? ' (Weekend)' : ''}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySlots.map((slot, i) => {
                const now = new Date();
                const [sh, sm] = slot.start_time.split(':');
                const [eh, em] = slot.end_time.split(':');
                const start = new Date(); start.setHours(parseInt(sh), parseInt(sm), 0, 0);
                const end = new Date(); end.setHours(parseInt(eh), parseInt(em), 0, 0);
                const isNow = now >= start && now <= end;
                const isPast = now > end;
                const color = subjectColors[slot.subject_name] || COLORS[0];

                return (
                  <div key={slot.id} className={`bg-white rounded-xl p-4 border-l-4 shadow-sm flex items-center gap-4 ${isNow ? 'ring-2 ring-[#1B263B]' : ''}`}
                    style={{ borderLeftColor: color }}>
                    <div className="text-center min-w-[52px]">
                      <p className="text-sm font-bold text-[#1B263B]">{formatTime(slot.start_time)}</p>
                      <p className="text-[10px] text-gray-400">{formatTime(slot.end_time)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#1B263B]">{slot.subject_name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{slot.room_number || 'TBA'}</p>
                    </div>
                    {isNow && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium animate-pulse">LIVE</span>}
                    {isPast && <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">Done</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'week' && (
        <div className="space-y-5">
          {DAYS.map(day => {
            const slots = timetable.filter(t => t.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
            const isToday = day === today;
            return (
              <div key={day} className={`bg-white rounded-xl border overflow-hidden ${isToday ? 'border-[#1B263B] ring-1 ring-[#1B263B]' : 'border-gray-100'}`}>
                <div className={`px-4 py-2 flex items-center justify-between ${isToday ? 'bg-[#1B263B] text-white' : 'bg-gray-50 text-gray-600'}`}>
                  <h4 className="font-semibold text-sm">{day} {isToday && '(Today)'}</h4>
                  <span className="text-xs opacity-70">{slots.length} class{slots.length !== 1 ? 'es' : ''}</span>
                </div>
                {slots.length === 0 ? (
                  <p className="text-xs text-gray-400 px-4 py-3">No classes</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {slots.map(slot => (
                      <div key={slot.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: subjectColors[slot.subject_name] || '#999' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1B263B]">{slot.subject_name}</p>
                          <p className="text-xs text-gray-400">{formatTime(slot.start_time)} – {formatTime(slot.end_time)} · {slot.room_number || 'TBA'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
