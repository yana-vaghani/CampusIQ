import { useState, useEffect } from 'react';
import { getEvents, createEvent, deleteEvent } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Calendar, Plus, Trash2, X, List } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

export default function AdminEvents() {
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState('list');
  const [form, setForm] = useState({ title: '', date: '', description: '' });

  useEffect(() => { loadEvents(); }, []);
  const loadEvents = () => getEvents().then(r => setEvents(r.data));

  const handleCreate = async () => {
    try {
      await createEvent(form);
      toast('Event created', 'success');
      setShowModal(false);
      setForm({ title: '', date: '', description: '' });
      loadEvents();
    } catch { toast('Failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    toast('Event deleted', 'success');
    loadEvents();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Events</h1>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('list')} className={`px-3 py-1 rounded-md text-xs ${view === 'list' ? 'bg-white shadow-sm' : ''}`}><List size={14} /></button>
            <button onClick={() => setView('calendar')} className={`px-3 py-1 rounded-md text-xs ${view === 'calendar' ? 'bg-white shadow-sm' : ''}`}><Calendar size={14} /></button>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Plus size={16} /> Create Event</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(e => (
          <div key={e.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-[#1B263B]">{e.title}</h4>
                <p className="text-xs text-[#415A77] mt-1 flex items-center gap-1"><Calendar size={12} /> {formatDate(e.date)}</p>
                <p className="text-sm text-gray-600 mt-2">{e.description}</p>
              </div>
              <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Create Event</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Event Name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 mb-3" />
            <button onClick={handleCreate} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm">Create</button>
          </div>
        </div>
      )}
    </div>
  );
}
