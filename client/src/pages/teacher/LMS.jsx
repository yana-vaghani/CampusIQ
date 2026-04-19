import { useState, useEffect } from 'react';
import { getLMSAll, getLMSContent, uploadLMSContent, deleteLMSContent, getMySubjects } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Upload, Trash2, FileText, Film, Link2, Plus, X } from 'lucide-react';

const TYPE_ICONS = { pdf: FileText, ppt: FileText, video: Film, link: Link2 };
const TYPE_COLORS = {
  pdf: 'bg-red-50 text-red-600',
  ppt: 'bg-orange-50 text-orange-600',
  video: 'bg-purple-50 text-purple-600',
  link: 'bg-blue-50 text-blue-600',
};

const API_BASE = 'http://localhost:5000';

export default function TeacherLMS() {
  const { toast } = useToast();
  const [content, setContent] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'pdf', subjectId: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = (sid) => {
    if (sid) {
      getLMSContent(sid).then(r => setContent(r.data)).catch(() => {});
    } else {
      getLMSAll().then(r => setContent(r.data)).catch(() => {});
    }
  };

  useEffect(() => {
    getMySubjects().then(r => { setSubjects(r.data); if (r.data[0]) setSelectedSubject(String(r.data[0].id)); }).catch(() => {});
  }, []);

  useEffect(() => { load(selectedSubject); }, [selectedSubject]);

  const handleUpload = async () => {
    if (!form.title || !form.subjectId || (!file && form.type !== 'link')) { toast('Fill all fields', 'error'); return; }
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('type', form.type);
    fd.append('subjectId', form.subjectId);
    if (file) fd.append('file', file);
    setUploading(true);
    try {
      await uploadLMSContent(fd);
      toast('Content uploaded!', 'success');
      setShowModal(false);
      setForm({ title: '', type: 'pdf', subjectId: '' });
      setFile(null);
      load(selectedSubject);
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this content?')) return;
    await deleteLMSContent(id);
    toast('Deleted', 'success');
    load(selectedSubject);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">LMS Content</h1>
        <button onClick={() => { setForm(f => ({...f, subjectId: selectedSubject})); setShowModal(true); }}
          className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
          <Plus size={16} /> Upload Content
        </button>
      </div>

      <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <option value="">All Subjects</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {content.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 text-gray-400">
          <Upload size={36} className="mx-auto mb-2 opacity-30" />
          <p>No content uploaded yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Title</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Subject</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {content.map(c => {
                const Icon = TYPE_ICONS[c.type] || FileText;
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${TYPE_COLORS[c.type] || ''}`}><Icon size={13} /></div>
                        <div>
                          <p className="font-medium text-[#1B263B]">{c.title}</p>
                          {c.original_filename && <p className="text-xs text-gray-400">{c.original_filename}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${TYPE_COLORS[c.type]}`}>{c.type}</span></td>
                    <td className="py-3 px-4 text-gray-500">{c.subject_name || '—'}</td>
                    <td className="py-3 px-4 text-xs text-gray-400">{new Date(c.uploaded_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {c.file_url && (
                          <a href={`${API_BASE}${c.file_url}`} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline px-2 py-1 bg-blue-50 rounded">View</a>
                        )}
                        <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Upload Content</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Content title *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <select value={form.subjectId} onChange={e => setForm(f=>({...f,subjectId:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="">Select Subject *</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="pdf">PDF</option>
              <option value="ppt">PPT / Slides</option>
              <option value="video">Video</option>
              <option value="link">External Link</option>
            </select>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center mb-4">
              <input type="file" id="lms-file" className="hidden" onChange={e => setFile(e.target.files[0])} />
              <label htmlFor="lms-file" className="cursor-pointer">
                <Upload size={20} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">{file ? file.name : 'Choose file to upload'}</p>
                <p className="text-xs text-gray-400 mt-1">PDF, PPT, Video, etc.</p>
              </label>
            </div>
            <button onClick={handleUpload} disabled={uploading} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
