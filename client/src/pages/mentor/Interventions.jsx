import { useState, useEffect } from 'react';
import { getInterventions } from '../../api/axios';
import { ClipboardList } from 'lucide-react';

export default function MentorInterventions() {
  const [interventions, setInterventions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    getInterventions({ type: typeFilter || undefined }).then(r => setInterventions(r.data));
  }, [typeFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Interventions</h1>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="counseling">Counseling</option>
          <option value="remedial">Remedial</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {interventions.length === 0 ? <p className="p-6 text-center text-gray-400">No interventions found</p> : (
          <div className="divide-y divide-gray-50">
            {interventions.map(i => (
              <div key={i.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1B263B] text-sm">{i.student_name}</span>
                    <span className="text-xs text-gray-400">({i.roll_no})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${i.type === 'counseling' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{i.type}</span>
                </div>
                <p className="text-sm text-gray-600">{i.remarks}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(i.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
