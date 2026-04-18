import { useState, useEffect } from 'react';
import { getFaculty } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Search, MapPin, User, BookOpen } from 'lucide-react';

export default function StudentFaculty() {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    getFaculty({ search, department: deptFilter || undefined }).then(r => setFaculty(r.data));
  }, [search, deptFilter]);

  const mentor = faculty.find(f => f.role === 'mentor');
  const departments = [...new Set(faculty.map(f => f.department).filter(Boolean))];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Faculty</h1>
      {mentor && (
        <div className="bg-gradient-to-r from-[#1B263B] to-[#415A77] rounded-xl p-6 text-white">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Your Mentor</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">{mentor.name?.charAt(0)}</div>
            <div>
              <p className="text-lg font-semibold">{mentor.name}</p>
              <p className="text-sm text-white/70">{mentor.department} • Cabin {mentor.cabin_number}</p>
              <p className="text-sm text-white/60">{mentor.email}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search faculty..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {faculty.map(f => (
          <div key={f.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[#1B263B]/10 flex items-center justify-center text-[#1B263B] font-semibold">{f.name?.charAt(0)}</div>
              <div className="flex-1">
                <p className="font-medium text-[#1B263B]">{f.name}</p>
                <p className="text-xs text-gray-500">{f.department}</p>
                {f.subjects && <p className="text-xs text-[#415A77] mt-1 flex items-center gap-1"><BookOpen size={12} /> {f.subjects}</p>}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} /> Cabin {f.cabin_number || 'N/A'}</p>
              <button className="text-xs text-[#415A77] hover:text-[#1B263B] font-medium">Locate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
