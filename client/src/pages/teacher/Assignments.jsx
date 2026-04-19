import { useState, useEffect } from 'react';
import { getAssignments, getSubmissions, gradeSubmission, createAssignment, deleteAssignment, getMySubjects } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Plus, X, Eye, ChevronDown, ChevronUp, Award, Clock, CheckCircle, AlertCircle, Download } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function TeacherAssignments() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subjectId: '', deadline: '', allowLate: false });
  const [grading, setGrading] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    getAssignments().then(r => setAssignments(r.data)).catch(() => {});
    getMySubjects().then(r => setSubjects(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!submissions[id]) {
      const r = await getSubmissions(id);
      setSubmissions(prev => ({ ...prev, [id]: r.data }));
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.subjectId || !form.deadline) { toast('Fill required fields', 'error'); return; }
    setSaving(true);
    try {
      await createAssignment({ ...form, subjectId: parseInt(form.subjectId) });
      toast('Assignment created', 'success');
      setShowCreate(false);
      setForm({ title: '', description: '', subjectId: '', deadline: '', allowLate: false });
      load();
    } catch { toast('Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    await deleteAssignment(id);
    toast('Deleted', 'success');
    load();
  };

  const handleGrade = async (assignmentId, studentId) => {
    const key = `${assignmentId}_${studentId}`;
    const { grade, remarks } = grading[key] || {};
    if (!grade) { toast('Enter a grade', 'error'); return; }
    try {
      await gradeSubmission(assignmentId, studentId, { grade: parseFloat(grade), gradeRemarks: remarks });
      toast('Grade saved', 'success');
      setSubmissions(prev => ({
        ...prev,
        [assignmentId]: prev[assignmentId].map(s =>
          s.student_id === studentId ? { ...s, grade: parseFloat(grade), grade_remarks: remarks } : s
        )
      }));
    } catch { toast('Failed', 'error'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Assignments</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
          <Plus size={16} /> New Assignment
        </button>
      </div>

      <div className="space-y-4">
        {assignments.map(a => {
          const subs = submissions[a.id] || [];
          const onTime = subs.filter(s => s.status === 'submitted').length;
          const late = subs.filter(s => s.status === 'late').length;
          const pending = subs.filter(s => s.status === 'pending').length;

          return (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-[#1B263B]">{a.title}</h4>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{a.subject_name}</span>
                    {a.allow_late && <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Late OK</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> Due: {new Date(a.deadline).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                  {expanded === a.id && subs.length > 0 && (
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10} /> {onTime} on-time</span>
                      <span className="text-xs text-orange-500 flex items-center gap-1"><Clock size={10} /> {late} late</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><AlertCircle size={10} /> {pending} pending</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleDelete(a.id)} className="text-gray-300 hover:text-red-500 text-xs px-2 py-1">Delete</button>
                  <button onClick={() => toggleExpand(a.id)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600">
                    Submissions {expanded === a.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {expanded === a.id && (
                <div className="border-t border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left py-2 px-4 text-gray-500 font-medium">Student</th>
                        <th className="text-left py-2 px-4 text-gray-500 font-medium">Status</th>
                        <th className="text-left py-2 px-4 text-gray-500 font-medium">Submitted</th>
                        <th className="text-left py-2 px-4 text-gray-500 font-medium">File</th>
                        <th className="text-left py-2 px-4 text-gray-500 font-medium">Grade</th>
                      </tr></thead>
                      <tbody>
                        {subs.map(sub => {
                          const key = `${a.id}_${sub.student_id}`;
                          return (
                            <tr key={sub.id || sub.student_id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 px-4">
                                <p className="font-medium text-[#1B263B]">{sub.student_name}</p>
                                <p className="text-xs text-gray-400">{sub.roll_no}</p>
                              </td>
                              <td className="py-2 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  sub.status === 'submitted' ? 'bg-green-50 text-green-700' :
                                  sub.status === 'late' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500'
                                }`}>{sub.status}</span>
                              </td>
                              <td className="py-2 px-4 text-xs text-gray-500">
                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' }) : '—'}
                              </td>
                              <td className="py-2 px-4">
                                {sub.file_url ? (
                                  <a href={`${API_BASE}${sub.file_url}`} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                    <Eye size={12} /> {sub.original_filename || 'View'}
                                  </a>
                                ) : '—'}
                              </td>
                              <td className="py-2 px-4">
                                {sub.grade !== null && sub.grade !== undefined ? (
                                  <span className="text-xs font-bold text-green-700">{sub.grade}/100</span>
                                ) : sub.file_url ? (
                                  <div className="flex items-center gap-1">
                                    <input type="number" min="0" max="100" placeholder="Grade"
                                      value={grading[key]?.grade || ''}
                                      onChange={e => setGrading(g => ({...g, [key]: {...g[key], grade: e.target.value}}))}
                                      className="w-16 border border-gray-200 rounded px-2 py-1 text-xs" />
                                    <button onClick={() => handleGrade(a.id, sub.student_id)}
                                      className="px-2 py-1 bg-[#1B263B] text-white rounded text-xs">
                                      <Award size={10} />
                                    </button>
                                  </div>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">New Assignment</h3><button onClick={() => setShowCreate(false)}><X size={18} /></button></div>
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Title *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <select value={form.subjectId} onChange={e => setForm(f=>({...f,subjectId:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="">Select Subject *</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm(f=>({...f,deadline:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <input type="checkbox" checked={form.allowLate} onChange={e => setForm(f=>({...f,allowLate:e.target.checked}))} />
              Allow late submissions
            </label>
            <button onClick={handleCreate} disabled={saving} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
