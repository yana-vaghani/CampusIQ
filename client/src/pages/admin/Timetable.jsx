import { useState, useEffect } from 'react';
import { getTimetable, createTimetableEntry, deleteTimetableEntry, getClassrooms } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Plus, Trash2, X } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SUBJECTS_MOCK = [
  { id: 1, name: 'Mathematics' }, { id: 2, name: 'Physics' },
  { id: 3, name: 'Computer Science' }, { id: 4, name: 'English' },
];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function AdminTimetable() {
  const { toast } = useToast();
  const [timetable, setTimetable] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [section, setSection] = useState('A');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subjectId: '', section: 'A', day: 'Monday', startTime: '09:00', endTime: '10:00', roomNumber: '' });

  const load = () => {
    getTimetable(section).then(r => setTimetable(r.data)).catch(() => {});
    getClassrooms().then(r => setClassrooms(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [section]);

  const handleCreate = async () => {
    if (!form.subjectId || !form.roomNumber) { toast('Fill all fields', 'error'); return; }
    try {
      await createTimetableEntry({ ...form, section });
      toast('Class added', 'success');
      setShowModal(false);
      load();
    } catch { toast('Failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this slot?')) return;
    await deleteTimetableEntry(id);
    toast('Deleted', 'success');
    load();
  };

  const grouped = DAYS.reduce((acc, d) => {
    acc[d] = timetable.filter(t => t.day === d).sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Timetable Management</h1>
        <button onClick={() => { setForm(f => ({...f, section})); setShowModal(true); }}
          className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
          <Plus size={16} /> Add Class
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <label className="text-sm text-gray-500">Section:</label>
        {['A','B','C'].map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${section === s ? 'bg-[#1B263B] text-white' : 'bg-gray-100 text-gray-500'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {DAYS.map(day => (
          <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-[#1B263B] text-sm">{day}</h3>
              <span className="text-xs text-gray-400">{grouped[day]?.length || 0} classes</span>
            </div>
            {grouped[day]?.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-3">No classes</p>
            ) : (
              <div className="flex flex-wrap gap-3 p-3">
                {grouped[day].map(t => (
                  <div key={t.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg min-w-[140px] relative group">
                    <p className="text-sm font-semibold text-[#1B263B]">{t.subject_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(t.start_time)} – {formatTime(t.end_time)}</p>
                    <p className="text-xs text-gray-400">{t.room_number}</p>
                    <button onClick={() => handleDelete(t.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-5">
              <h3 className="font-semibold">Add Class</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <label className="text-xs text-gray-500 block mb-1">Subject</label>
            <select value={form.subjectId} onChange={e => setForm(f=>({...f,subjectId:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="">Select Subject *</option>
              {SUBJECTS_MOCK.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <label className="text-xs text-gray-500 block mb-1">Day</label>
            <select value={form.day} onChange={e => setForm(f=>({...f,day:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Start Time</label>
                <input type="time" value={form.startTime} onChange={e => setForm(f=>({...f,startTime:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">End Time</label>
                <input type="time" value={form.endTime} onChange={e => setForm(f=>({...f,endTime:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <label className="text-xs text-gray-500 block mb-1">Classroom</label>
            <select value={form.roomNumber} onChange={e => setForm(f=>({...f,roomNumber:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5">
              <option value="">Select Classroom *</option>
              {classrooms.map(r => <option key={r.id} value={r.number}>{r.number} ({r.type}, {r.capacity} seats)</option>)}
            </select>
            <button onClick={handleCreate} className="w-full py-2.5 bg-[#1B263B] text-white rounded-lg text-sm font-medium">
              Add Class
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
