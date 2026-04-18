import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentAssignments, submitAssignment } from '../../api/axios';
import { FileText, Upload, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { formatDateTime, daysUntil } from '../../utils/formatDate';
import { useToast } from '../../components/shared/Toast';

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [showUpload, setShowUpload] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentAssignments(user.studentId).then(r => setAssignments(r.data)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!file || !showUpload) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await submitAssignment(showUpload, fd);
      toast('Assignment submitted successfully!', 'success');
      setShowUpload(null); setFile(null);
      getStudentAssignments(user.studentId).then(r => setAssignments(r.data));
    } catch { toast('Upload failed', 'error'); }
  };

  const upcoming = assignments.filter(a => !a.submission_status || a.submission_status === 'pending');
  const submitted = assignments.filter(a => a.submission_status === 'submitted');
  const overdue = assignments.filter(a => a.submission_status === 'late');

  const statusColors = { submitted: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700', late: 'bg-red-50 text-red-700' };

  const Section = ({ title, items, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-[#1B263B] mb-4 flex items-center gap-2">
        <Icon size={18} style={{ color }} /> {title} <span className="text-xs text-gray-400 font-normal">({items.length})</span>
      </h3>
      {items.length === 0 ? <p className="text-sm text-gray-400">None</p> : (
        <div className="space-y-3">{items.map(a => (
          <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#1B263B]">{a.title}</p>
              <p className="text-xs text-gray-500">{a.subject_name} • Due: {formatDateTime(a.deadline)}</p>
              {a.submitted_at && <p className="text-xs text-gray-400 mt-1">Submitted: {formatDateTime(a.submitted_at)}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.submission_status || 'pending']}`}>
                {a.submission_status || 'pending'}
              </span>
              {(!a.submission_status || a.submission_status === 'pending') && (
                <button onClick={() => setShowUpload(a.id)} className="px-3 py-1 bg-[#1B263B] text-white rounded-lg text-xs hover:bg-[#2d3e5c]">
                  <Upload size={12} className="inline mr-1" />Submit
                </button>
              )}
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Assignments</h1>
      <Section title="Upcoming" items={upcoming} icon={Clock} color="#FFC300" />
      <Section title="Submitted" items={submitted} icon={CheckCircle} color="#354F52" />
      <Section title="Overdue" items={overdue} icon={AlertTriangle} color="#A4161A" />
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUpload(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-[#1B263B]">Submit Assignment</h3>
              <button onClick={() => setShowUpload(null)}><X size={18} /></button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" id="fileUpload" />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">{file ? file.name : 'Click to upload or drag and drop'}</p>
              </label>
            </div>
            <button onClick={handleSubmit} disabled={!file} className="w-full mt-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm disabled:opacity-50">
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
