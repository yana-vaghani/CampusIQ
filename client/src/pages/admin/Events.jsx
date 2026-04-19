import { useState, useEffect } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Calendar, Plus, Trash2, X, Edit2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

export default function AdminEvents() {
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => getEvents().then(r => setEvents(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: '', startDate: '', endDate: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (e) => {
    setEditTarget(e);
    setForm({ title: e.title, startDate: e.start_date?.split('T')[0] || '', endDate: e.end_date?.split('T')[0] || '', description: e.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate) { toast('Title and start date required', 'error'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await updateEvent(editTarget.id, form);
        toast('Event updated', 'success');
      } else {
        await createEvent(form);
        toast('Event created', 'success');
      }
      setShowModal(false);
      load();
    } catch { toast('Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    toast('Event deleted', 'success');
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Events</h1>
        <button onClick={openCreate} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
          <Plus size={16} /> Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 text-gray-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>No events scheduled</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(e => {
            const start = new Date(e.start_date);
            const end = e.end_date ? new Date(e.end_date) : null;
            const isSingleDay = !end || e.start_date === e.end_date;
            return (
              <div key={e.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#1B263B] text-white rounded-lg p-2 text-center min-w-[44px]">
                      <p className="text-lg font-bold leading-none">{start.getDate()}</p>
                      <p className="text-[10px] uppercase opacity-70">{start.toLocaleString('en',{month:'short'})}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1B263B]">{e.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isSingleDay ? start.toLocaleDateString('en-IN', { dateStyle: 'medium' }) :
                          `${start.toLocaleDateString('en-IN', {dateStyle:'medium'})} → ${end.toLocaleDateString('en-IN', {dateStyle:'medium'})}`}
                      </p>
                      {!isSingleDay && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {Math.ceil((end - start) / (1000*60*60*24)) + 1} days
                        </span>
                      )}
                      {e.description && <p className="text-sm text-gray-500 mt-2">{e.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-[#1B263B] hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-5">
              <h3 className="font-semibold text-[#1B263B]">{editTarget ? 'Edit Event' : 'Create Event'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
              placeholder="Event name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Start Date *</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">End Date (optional)</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))}
                  min={form.startDate} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
              placeholder="Description (optional)" rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" />
            <button onClick={handleSave} disabled={saving}
              className="w-full py-2.5 bg-[#1B263B] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving...' : editTarget ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
