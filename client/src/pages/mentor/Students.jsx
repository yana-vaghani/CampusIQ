import { useState, useEffect } from 'react';
import { getStudents } from '../../api/axios';
import RiskBadge from '../../components/shared/RiskBadge';
import { Link } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';

export default function MentorStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  useEffect(() => {
    getStudents().then(r => setStudents(r.data)).catch(() => {});
  }, []);

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_no.toLowerCase().includes(search.toLowerCase());
    const matchRisk = !riskFilter || s.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Students</h1>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll no..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Academic Levels</option>
          <option value="high">Needs Attention</option>
          <option value="medium">Moderate</option>
          <option value="low">On Track</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Student</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Roll No</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Academic Level</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Academic Score</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
          </tr></thead>
          <tbody>{filtered.map(s => (
            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-[#1B263B]">{s.name}</td>
              <td className="py-3 px-4 text-gray-500">{s.roll_no}</td>
              <td className="py-3 px-4"><RiskBadge level={s.riskLevel} size="sm" /></td>
              <td className="py-3 px-4">{s.riskScore ?? '—'}</td>
              <td className="py-3 px-4">
                <Link to={`/mentor/students/${s.id}`} className="flex items-center gap-1 text-[#415A77] hover:text-[#1B263B] text-xs font-medium">
                  <Eye size={14} /> View Profile
                </Link>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
