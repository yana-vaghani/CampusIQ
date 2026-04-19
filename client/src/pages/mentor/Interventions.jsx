import { useState, useEffect } from 'react';
import { getStudentInterventions, getInterventionSuggestions, createIntervention, deleteIntervention } from '../../api/axios';
import { getStudents } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Brain, Plus, Trash2, X, Sparkles, Clock } from 'lucide-react';
import RiskBadge from '../../components/shared/RiskBadge';

const TYPE_OPTIONS = [
  { value: 'counseling', label: '🧠 Counseling Session' },
  { value: 'remedial', label: '📚 Remedial Class' },
  { value: 'assignment_extension', label: '📝 Assignment Extension' },
  { value: 'parent_communication', label: '📧 Parent Communication' },
  { value: 'other', label: '🔧 Other' },
];

function SuggestionsPanel({ studentId, studentName }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const load = () => {
    setLoading(true);
    getInterventionSuggestions(studentId)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [studentId]);

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-xl" />;
  if (!data) return null;

  const lines = data.suggestions?.split('\n').filter(l => l.trim()) || [];

  return (
    <div className="bg-gradient-to-br from-[#1B263B] to-[#415A77] rounded-xl p-4 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} />
        <h4 className="font-semibold text-sm">AI Suggestions for {studentName}</h4>
        <span className="ml-auto text-xs opacity-60">Risk: {data.riskData?.score}/100</span>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => <p key={i} className="text-sm opacity-90 leading-relaxed">{l}</p>)}
      </div>
    </div>
  );
}

export default function MentorInterventions() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: '', type: 'counseling', remarks: '', scheduledAt: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getStudents().then(r => setStudents(r.data)).catch(() => {}); }, []);

  const loadInterventions = (sid) => {
    getStudentInterventions(sid).then(r => setInterventions(r.data)).catch(() => {});
  };

  const selectStudent = (s) => {
    setSelectedStudent(s);
    loadInterventions(s.id);
    setForm(f => ({ ...f, studentId: s.id }));
  };

  const handleCreate = async () => {
    if (!form.studentId || !form.remarks.trim()) { toast('Fill all fields', 'error'); return; }
    setSaving(true);
    try {
      const r = await createIntervention(form);
      toast('Intervention created', 'success');
      setShowModal(false);
      loadInterventions(form.studentId);
      setForm(f => ({ ...f, remarks: '', scheduledAt: '' }));
    } catch { toast('Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this intervention?')) return;
    await deleteIntervention(id);
    toast('Deleted', 'success');
    if (selectedStudent) loadInterventions(selectedStudent.id);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Interventions</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
          <Plus size={16} /> Log Intervention
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Student list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#1B263B] text-sm">Students</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {students.map(s => (
              <button key={s.id} onClick={() => selectStudent(s)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedStudent?.id === s.id ? 'bg-blue-50' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-[#1B263B]">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.roll_no}</p>
                </div>
                {s.riskLevel && <RiskBadge level={s.riskLevel} />}
              </button>
            ))}
          </div>
        </div>

        {/* Intervention detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStudent ? (
            <>
              <SuggestionsPanel studentId={selectedStudent.id} studentName={selectedStudent.name} />
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-[#1B263B] text-sm">Intervention History — {selectedStudent.name}</h3>
                  <button onClick={() => { setForm(f => ({...f, studentId: selectedStudent.id})); setShowModal(true); }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#1B263B] text-white rounded-lg">
                    <Plus size={12} /> Add
                  </button>
                </div>
                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                  {interventions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No interventions yet</p>
                  ) : interventions.map(iv => (
                    <div key={iv.id} className="px-4 py-3 group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full capitalize">{iv.type.replace('_', ' ')}</span>
                            <span className="text-xs text-gray-400">{new Date(iv.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1.5">{iv.remarks}</p>
                          {iv.scheduled_at && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Clock size={10} /> Scheduled: {new Date(iv.scheduled_at).toLocaleString()}
                            </p>
                          )}
                          {iv.llm_suggestion && (
                            <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg p-2">
                              <p className="text-[10px] text-purple-500 font-medium mb-1 flex items-center gap-1"><Sparkles size={9} /> AI Recommendation</p>
                              <p className="text-xs text-purple-700 line-clamp-3">{iv.llm_suggestion.split('\n')[0]}</p>
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleDelete(iv.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 ml-2 mt-0.5">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-100 text-gray-400">
              <div className="text-center">
                <Brain size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a student to view interventions and AI suggestions</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-[#1B263B]">Log Intervention</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <select value={form.studentId} onChange={e => setForm(f => ({...f, studentId: e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="">Select Student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_no})</option>)}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <textarea value={form.remarks} onChange={e => setForm(f => ({...f, remarks: e.target.value}))}
              placeholder="Describe the intervention details and outcome..." rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Schedule Date/Time (optional)</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-600 flex items-center gap-1"><Sparkles size={10} /> AI suggestions will be auto-generated when you save</p>
            </div>
            <button onClick={handleCreate} disabled={saving} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Log Intervention'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
