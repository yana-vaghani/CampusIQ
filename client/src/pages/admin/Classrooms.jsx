import { useState, useEffect } from 'react';
import { getClassrooms, createClassroom, deleteClassroom } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Building2, Plus, Trash2, X } from 'lucide-react';

const ROOM_TYPES = ['lecture', 'lab', 'seminar'];

export default function AdminClassrooms() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ number: '', capacity: 60, type: 'lecture', building: '' });
  const [saving, setSaving] = useState(false);

  const load = () => getClassrooms().then(r => setRooms(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.number) { toast('Room number required', 'error'); return; }
    setSaving(true);
    try {
      await createClassroom(form);
      toast('Room added', 'success');
      setShowModal(false);
      setForm({ number: '', capacity: 60, type: 'lecture', building: '' });
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room?')) return;
    await deleteClassroom(id);
    toast('Room deleted', 'success');
    load();
  };

  const typeColor = (type) => ({
    lecture: 'bg-blue-50 text-blue-700',
    lab: 'bg-purple-50 text-purple-700',
    seminar: 'bg-green-50 text-green-700',
  }[type] || 'bg-gray-50 text-gray-600');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Classrooms</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
          <Plus size={16} /> Add Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {ROOM_TYPES.map(t => (
          <div key={t} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-[#1B263B]">{rooms.filter(r => r.type === t).length}</p>
            <p className="text-sm text-gray-500 capitalize">{t} Rooms</p>
          </div>
        ))}
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No rooms added yet</p>
        </div>
      ) : (
        <>
          {/* Grid Map */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-[#1B263B] mb-4">Campus Grid View</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {rooms.map(r => (
                <div key={r.id} className={`p-3 rounded-xl text-center border ${typeColor(r.type)} border-current/20`}>
                  <Building2 size={16} className="mx-auto mb-1 opacity-60" />
                  <p className="text-sm font-semibold">{r.number}</p>
                  <p className="text-[10px] opacity-70 capitalize">{r.type}</p>
                  <p className="text-[10px] opacity-60">{r.capacity} seats</p>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Room</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Capacity</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Building</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium"></th>
              </tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-[#1B263B]">{r.number}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${typeColor(r.type)}`}>{r.type}</span></td>
                    <td className="py-3 px-4 text-gray-500">{r.capacity}</td>
                    <td className="py-3 px-4 text-gray-400">{r.building || '—'}</td>
                    <td className="py-3 px-4"><button onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-5">
              <h3 className="font-semibold text-[#1B263B]">Add Room</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <input value={form.number} onChange={e => setForm(f=>({...f,number:e.target.value}))}
              placeholder="Room number (e.g. LH-101) *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f=>({...f,capacity:parseInt(e.target.value)}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {ROOM_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
            </div>
            <input value={form.building} onChange={e => setForm(f=>({...f,building:e.target.value}))}
              placeholder="Building (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5" />
            <button onClick={handleCreate} disabled={saving}
              className="w-full py-2.5 bg-[#1B263B] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Room'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
