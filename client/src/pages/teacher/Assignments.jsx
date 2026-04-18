import { useState, useEffect } from 'react';
import { getAssignments, createAssignment, getSubmissions } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Plus, X, Eye, Download } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';

export default function TeacherAssignments() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSubs, setShowSubs] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', subjectId: '1', deadline: '' });

  useEffect(() => { loadAssignments(); }, []);
  const loadAssignments = () => getAssignments({}).then(r => setAssignments(r.data));

  const handleCreate = async () => {
    try {
      await createAssignment(form);
      toast('Assignment created', 'success');
      setShowCreate(false);
      setForm({ title: '', description: '', subjectId: '1', deadline: '' });
      loadAssignments();
    } catch { toast('Failed to create', 'error'); }
  };

  const viewSubmissions = async (id) => {
    const res = await getSubmissions(id);
    setSubmissions(res.data);
    setShowSubs(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Assignments</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Plus size={16} /> Create</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left py-3 px-4 text-gray-500">Title</th>
            <th className="text-left py-3 px-4 text-gray-500">Subject</th>
            <th className="text-left py-3 px-4 text-gray-500">Deadline</th>
            <th className="text-left py-3 px-4 text-gray-500">Actions</th>
          </tr></thead>
          <tbody>{assignments.map(a => (
            <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-[#1B263B]">{a.title}</td>
              <td className="py-3 px-4 text-gray-500">{a.subject_name}</td>
              <td className="py-3 px-4 text-gray-500">{formatDateTime(a.deadline)}</td>
              <td className="py-3 px-4">
                <button onClick={() => viewSubmissions(a.id)} className="flex items-center gap-1 text-[#415A77] hover:text-[#1B263B] text-xs font-medium">
                  <Eye size={14} /> Submissions
                </button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Create Assignment</h3><button onClick={() => setShowCreate(false)}><X size={18} /></button></div>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 mb-3" />
            <select value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="1">Mathematics</option><option value="2">Physics</option><option value="3">Computer Science</option>
            </select>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <button onClick={handleCreate} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm">Publish</button>
          </div>
        </div>
      )}

      {showSubs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSubs(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Submissions</h3><button onClick={() => setShowSubs(null)}><X size={18} /></button></div>
            {submissions.length === 0 ? <p className="text-sm text-gray-400">No submissions yet</p> : (
              <div className="space-y-2">{submissions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{s.student_name} ({s.roll_no})</p>
                    <p className="text-xs text-gray-500">{s.submitted_at ? formatDateTime(s.submitted_at) : 'Not submitted'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'submitted' ? 'bg-green-50 text-green-700' : s.status === 'late' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{s.status}</span>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
