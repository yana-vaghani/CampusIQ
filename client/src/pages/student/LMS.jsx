import { useState, useEffect } from 'react';
import { getLMSContent } from '../../api/axios';
import { BookOpen, FileText, Video, Presentation, Search, Download, ExternalLink } from 'lucide-react';

const typeIcons = { pdf: FileText, video: Video, ppt: Presentation };
const typeColors = { pdf: '#A4161A', video: '#415A77', ppt: '#FFC300' };

export default function StudentLMS() {
  const [content, setContent] = useState([]);
  const [subjects] = useState([
    { id: 1, name: 'Mathematics' }, { id: 2, name: 'Physics' }, { id: 3, name: 'Computer Science' }
  ]);
  const [activeSubject, setActiveSubject] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLMSContent(activeSubject, { search, type: typeFilter || undefined })
      .then(r => setContent(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [activeSubject, search, typeFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Learning Hub</h1>
      <div className="flex gap-2 flex-wrap">
        {subjects.map(s => (
          <button key={s.id} onClick={() => setActiveSubject(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSubject === s.id ? 'bg-[#1B263B] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search content..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="ppt">PPT</option>
          <option value="video">Video</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.map(c => {
          const Icon = typeIcons[c.type] || FileText;
          return (
            <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${typeColors[c.type]}15` }}>
                  <Icon size={20} style={{ color: typeColors[c.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#1B263B] text-sm truncate">{c.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{new Date(c.uploaded_at).toLocaleDateString()} • {c.type.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs hover:bg-gray-100 transition-colors">
                  <Download size={14} /> Download
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#1B263B] text-white rounded-lg text-xs hover:bg-[#2d3e5c] transition-colors">
                  <ExternalLink size={14} /> Open
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {content.length === 0 && !loading && <p className="text-center text-gray-400 py-12">No content available</p>}
    </div>
  );
}
