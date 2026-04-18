import { useState, useEffect } from 'react';
import { getTimetable, createTimetableEntry, deleteTimetableEntry } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Plus, Trash2, X } from 'lucide-react';
import { formatTime } from '../../utils/formatDate';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

export default function AdminTimetable() {
  const { toast } = useToast();
  const [timetable, setTimetable] = useState([]);
  const [section, setSection] = useState('A');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subjectId: '1', section: 'A', day: 'Monday', startTime: '09:00', endTime: '10:00', roomNumber: '' });

  useEffect(() => { loadTimetable(); }, [section]);
  const loadTimetable = () => getTimetable(section).then(r => setTimetable(r.data));

  const handleCreate = async () => {
    try {
      await createTimetableEntry(form);
      toast('Class added', 'success');
      setShowModal(false);
      loadTimetable();
    } catch { toast('Failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this slot?')) return;
    await deleteTimetableEntry(id);
    toast('Deleted', 'success');
    loadTimetable();
  };

  const grouped = DAYS.reduce((acc, d) => { acc[d] = timetable.filter(t => t.day === d); return acc; }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Timetable Management</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Plus size={16} /> Add Class</button>
      </div>
      <select value={section} onChange={e => setSection(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <option value="A">Section A</option><option value="B">Section B</option>
      </select>
      {DAYS.map(day => (
        <div key={day} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-3">{day}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {grouped[day]?.map(t => (
              <div key={t.id} className="p-3 bg-gray-50 rounded-lg relative group">
                <p className="text-sm font-medium text-[#1B263B]">{t.subject_name}</p>
                <p className="text-xs text-gray-500 mt-1">{formatTime(t.start_time)} - {formatTime(t.end_time)}</p>
                <p className="text-xs text-gray-400">{t.room_number}</p>
                <button onClick={() => handleDelete(t.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"><Trash2 size={14} /></button>
              </div>
            ))}
            {grouped[day]?.length === 0 && <p className="text-xs text-gray-400">No classes</p>}
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Add Class</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <select value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="1">Mathematics</option><option value="2">Physics</option><option value="3">Computer Science</option>
            </select>
            <select value={form.day} onChange={e => setForm({...form, day: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} placeholder="Room Number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <button onClick={handleCreate} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
