import { useState, useEffect } from 'react';
import { getStudentAssignments, submitAssignment, getMySubmission } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getStudentMe } from '../../api/axios';
import { Clock, CheckCircle, AlertTriangle, Upload, Eye, RefreshCw, FileText, X } from 'lucide-react';
import { useToast } from '../../components/shared/Toast';

const API_BASE = 'http://localhost:5000';

function SubmitModal({ assignment, studentId, onClose, onSuccess }) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    getMySubmission(assignment.id).then(r => setExisting(r.data)).catch(() => {});
  }, [assignment.id]);

  const handleSubmit = async () => {
    if (!file) { toast('Please select a file', 'error'); return; }
    const fd = new FormData();
    fd.append('file', file);
    setSubmitting(true);
    try {
      const r = await submitAssignment(assignment.id, fd);
      toast(r.data.isLate ? 'Submitted (late)' : 'Submitted successfully!', r.data.isLate ? 'warning' : 'success');
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.error || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deadline = new Date(assignment.deadline);
  const isLate = new Date() > deadline;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold text-[#1B263B]">{existing ? 'Resubmit' : 'Submit'} Assignment</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-1">{assignment.title}</p>
        <p className="text-xs text-gray-400 mb-3">{assignment.subject_name}</p>
        {isLate && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-sm text-orange-700 mb-3">
            ⚠️ Deadline passed — {assignment.allow_late ? 'late submission allowed' : 'late submission NOT allowed'}
          </div>
        )}
        {existing?.file_url && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <FileText size={14} />
              <span>{existing.original_filename || 'Previously submitted file'}</span>
            </div>
            <a href={`${API_BASE}${existing.file_url}`} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 underline">View</a>
          </div>
        )}
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center mb-4">
          <input type="file" id="submit-file" className="hidden" onChange={e => setFile(e.target.files[0])} />
          <label htmlFor="submit-file" className="cursor-pointer">
            <Upload size={20} className="mx-auto text-gray-400 mb-1" />
            <p className="text-sm text-gray-500">{file ? file.name : 'Click to choose file'}</p>
          </label>
        </div>
        <button onClick={handleSubmit} disabled={submitting || (isLate && !assignment.allow_late)}
          className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm disabled:opacity-50">
          {submitting ? 'Submitting...' : existing ? 'Resubmit' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

function AssignmentCard({ a, onSubmit }) {
  const now = new Date();
  const deadline = new Date(a.deadline);
  const isLate = now > deadline;
  const isSubmitted = a.submission_status === 'submitted' || a.submission_status === 'late';

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 card-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1B263B] text-sm truncate">{a.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{a.subject_name} · {a.subject_code}</p>
          {a.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.description}</p>}
          <p className={`text-xs mt-2 flex items-center gap-1 ${isLate && !isSubmitted ? 'text-red-500' : 'text-gray-500'}`}>
            <Clock size={12} /> {isLate ? 'Was due' : 'Due'}: {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
          </p>
          {a.grade !== null && a.grade !== undefined && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded px-2 py-1 inline-flex items-center gap-1">
              <span className="text-xs text-green-700 font-medium">Grade: {a.grade}/100</span>
              {a.grade_remarks && <span className="text-xs text-green-600"> — {a.grade_remarks}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {isSubmitted ? (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${a.submission_status === 'late' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'}`}>
              {a.submission_status === 'late' ? 'Late' : 'Submitted'}
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isLate ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
              {isLate ? 'Overdue' : 'Pending'}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {a.submission_url && (
          <a href={`${API_BASE}${a.submission_url}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            <Eye size={12} /> View Submission
          </a>
        )}
        {(!isLate || a.allow_late) && (
          <button onClick={() => onSubmit(a)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1B263B] text-white rounded-lg text-xs">
            {isSubmitted ? <><RefreshCw size={12} /> Resubmit</> : <><Upload size={12} /> Submit</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentAssignments() {
  const { user } = useAuth();
  const [data, setData] = useState({ upcoming: [], completed: [], pastDue: [], all: [] });
  const [loading, setLoading] = useState(true);
  const studentId = user?.studentId;
  const [tab, setTab] = useState('upcoming');
  const [submitTarget, setSubmitTarget] = useState(null);

  const load = () => {
    if (!studentId) return;
    setLoading(true);
    getStudentAssignments(studentId)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [studentId]);

  const TABS = [
    { key: 'upcoming', label: 'Upcoming', icon: Clock, count: data.upcoming?.length, color: 'text-blue-600' },
    { key: 'completed', label: 'Completed', icon: CheckCircle, count: data.completed?.length, color: 'text-green-600' },
    { key: 'pastDue', label: 'Past Due', icon: AlertTriangle, count: data.pastDue?.length, color: 'text-red-600' },
  ];

  const assignments = data[tab] || [];

  if (loading) return <div className="space-y-3 animate-pulse">{[1,2,3].map(i=><div key={i} className="h-28 bg-gray-100 rounded-xl"/>)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Assignments</h1>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
            <t.icon size={14} className={tab === t.key ? t.color : 'text-gray-400'} />
            {t.label}
            {t.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? `${t.color} bg-opacity-10` : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {tab === 'upcoming' ? 'upcoming' : tab === 'completed' ? 'completed' : 'overdue'} assignments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(a => (
            <AssignmentCard key={a.id} a={a} onSubmit={setSubmitTarget} />
          ))}
        </div>
      )}

      {submitTarget && (
        <SubmitModal
          assignment={submitTarget}
          studentId={studentId}
          onClose={() => setSubmitTarget(null)}
          onSuccess={() => { setSubmitTarget(null); load(); }}
        />
      )}
    </div>
  );
}
