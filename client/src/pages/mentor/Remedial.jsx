import { useState, useEffect } from 'react';
import { createIntervention, getStudents } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Calendar, Plus, X, Clock } from 'lucide-react';

export default function MentorRemedial() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: '', remarks: '', scheduledAt: '', type: 'remedial' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStudents().then(r => setStudents(r.data)).catch(() => {});
    // Load existing remedial from local state
  }, []);

  const handleCreate = async () => {
    if (!form.studentId || !form.remarks.trim() || !form.scheduledAt) {
      toast('Fill all required fields', 'error'); return;
    }
    setSaving(true);
    try {
      const r = await createIntervention({ ...form, type: 'remedial' });
      toast('Remedial class scheduled!', 'success');
      setSessions(prev => [...prev, {
        ...r.data,
        student_name: students.find(s => s.id === parseInt(form.studentId))?.name || 'Student',
        scheduledAt: form.scheduledAt,
      }]);
      setShowModal(false);
      setForm({ studentId: '', remarks: '', scheduledAt: '', type: 'remedial' });
    } catch { toast('Failed to schedule', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Remedial Classes</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
          <Plus size={16} /> Schedule Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Calendar size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">No remedial classes scheduled yet</p>
          <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
            Schedule First Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-[#1B263B]">{s.student_name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{s.remarks}</p>
                </div>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">Remedial</span>
              </div>
              {s.scheduledAt && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <Clock size={14} />
                  {new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-5">
              <h3 className="font-semibold text-[#1B263B]">Schedule Remedial Session</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <label className="block text-xs text-gray-500 mb-1">Student *</label>
            <select value={form.studentId} onChange={e => setForm(f=>({...f, studentId: e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4">
              <option value="">Select student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_no})</option>)}
            </select>
            <label className="block text-xs text-gray-500 mb-1">Topic / Remarks *</label>
            <textarea value={form.remarks} onChange={e => setForm(f=>({...f, remarks: e.target.value}))}
              placeholder="e.g., Revision of Calculus Chapter 3..." rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" />
            <label className="block text-xs text-gray-500 mb-1">Date & Time *</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f=>({...f, scheduledAt: e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5" />
            <button onClick={handleCreate} disabled={saving}
              className="w-full py-2.5 bg-[#1B263B] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Scheduling...' : 'Schedule Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
