import { useState, useEffect } from 'react';
import { getLMSContent, uploadLMSContent, deleteLMSContent } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Upload, Trash2, FileText, Video, Presentation, Plus, X } from 'lucide-react';

export default function TeacherLMS() {
  const { toast } = useToast();
  const [content, setContent] = useState([]);
  const [subjectId, setSubjectId] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'pdf', subjectId: '1' });
  const [file, setFile] = useState(null);

  useEffect(() => { loadContent(); }, [subjectId]);
  const loadContent = () => getLMSContent(subjectId).then(r => setContent(r.data));

  const handleUpload = async () => {
    if (!file || !form.title) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    fd.append('type', form.type);
    fd.append('subjectId', form.subjectId);
    try {
      await uploadLMSContent(fd);
      toast('Content uploaded', 'success');
      setShowModal(false); setFile(null); setForm({ title: '', type: 'pdf', subjectId: '1' });
      loadContent();
    } catch { toast('Upload failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this content?')) return;
    await deleteLMSContent(id);
    toast('Deleted', 'success');
    loadContent();
  };

  const typeIcons = { pdf: FileText, video: Video, ppt: Presentation };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">LMS Content</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Plus size={16} /> Upload Content</button>
      </div>
      <div className="flex gap-2">
        {[{id:1,name:'Mathematics'},{id:2,name:'Physics'},{id:3,name:'Computer Science'}].map(s => (
          <button key={s.id} onClick={() => setSubjectId(s.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${subjectId === s.id ? 'bg-[#1B263B] text-white' : 'bg-white border border-gray-200'}`}>{s.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.map(c => {
          const Icon = typeIcons[c.type] || FileText;
          return (
            <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Icon size={20} className="text-[#415A77] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-[#1B263B]">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{c.type.toUpperCase()} • {new Date(c.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Upload Content</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <select value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="1">Mathematics</option><option value="2">Physics</option><option value="3">Computer Science</option>
            </select>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="pdf">PDF</option><option value="ppt">PPT</option><option value="video">Video</option>
            </select>
            <input type="file" onChange={e => setFile(e.target.files[0])} className="w-full text-sm mb-3" />
            <button onClick={handleUpload} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm">Upload</button>
          </div>
        </div>
      )}
    </div>
  );
}
