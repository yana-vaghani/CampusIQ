import { useState, useEffect } from 'react';
import { getLMSAll } from '../../api/axios';
import { FileText, Film, Presentation, Link2, Download, Search, BookOpen, Eye } from 'lucide-react';

// File URLs use relative path — Vite proxy forwards /uploads to backend

const TYPE_ICONS = {
  pdf: FileText,
  ppt: Presentation,
  video: Film,
  link: Link2,
  docx: FileText,
};
const TYPE_COLORS = {
  pdf: 'bg-red-50 text-red-600 border-red-100',
  ppt: 'bg-orange-50 text-orange-600 border-orange-100',
  video: 'bg-purple-50 text-purple-600 border-purple-100',
  link: 'bg-blue-50 text-blue-600 border-blue-100',
  docx: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

export default function StudentLMS() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', search: '', subjectId: '' });
  const [subjects, setSubjects] = useState([]);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter.type !== 'all') params.type = filter.type;
    if (filter.search) params.search = filter.search;
    if (filter.subjectId) params.subjectId = filter.subjectId;
    getLMSAll(params)
      .then(r => {
        setContent(r.data);
        // Extract unique subjects
        const subs = {};
        r.data.forEach(c => { if (c.subject_name) subs[c.subject_id] = { id: c.subject_id, name: c.subject_name, code: c.subject_code }; });
        if (Object.keys(subs).length > 0) setSubjects(Object.values(subs));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleView = (item) => {
    if (!item.file_url) {
      window.open(item.title, '_blank');
      return;
    }
    window.open(`${item.file_url}`, '_blank');
  };

  const handleDownload = async (item) => {
    if (!item.file_url) {
      window.open(item.title, '_blank');
      return;
    }
    try {
      const response = await fetch(`${item.file_url}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.original_filename || item.title || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Fallback: direct link download
      const a = document.createElement('a');
      a.href = `${item.file_url}`;
      a.download = item.original_filename || item.title;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Learning Hub</h1>
        <p className="text-sm text-gray-500">Study materials, videos and resources</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))}
            placeholder="Search materials..." className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filter.subjectId} onChange={e => setFilter(f => ({...f, subjectId: e.target.value}))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {['all','pdf','ppt','video','docx'].map(t => (
            <button key={t} onClick={() => setFilter(f => ({...f, type: t}))}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${filter.type === t ? 'bg-white shadow-sm text-[#1B263B]' : 'text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No materials found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map(item => {
            const Icon = TYPE_ICONS[item.type] || FileText;
            const colorClass = TYPE_COLORS[item.type] || TYPE_COLORS.pdf;
            return (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${colorClass}`}><Icon size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1B263B] leading-tight">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.subject_name} · {item.subject_code}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {item.uploaded_by_name} · {new Date(item.uploaded_at).toLocaleDateString()}
                        {item.original_filename && <span className="ml-1">· {item.original_filename}</span>}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleView(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                    <Eye size={12} /> View
                  </button>
                  <button onClick={() => handleDownload(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#1B263B] text-white rounded-lg text-xs hover:bg-[#2d3e5c] transition-colors">
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
