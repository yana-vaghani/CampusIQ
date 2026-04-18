import { useState } from 'react';
import { GRADE_BOUNDARIES } from '../../utils/gradeCalc';
import { Save } from 'lucide-react';

export default function TeacherGrades() {
  const [boundaries, setBoundaries] = useState(GRADE_BOUNDARIES.map(b => ({...b})));

  const update = (i, field, value) => {
    setBoundaries(prev => prev.map((b, idx) => idx === i ? {...b, [field]: parseInt(value) || 0} : b));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Grade Settings</h1>
        <button className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Save size={16} /> Save</button>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Grade Boundaries</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-gray-500">Grade</th>
            <th className="text-left py-3 px-4 text-gray-500">Label</th>
            <th className="text-center py-3 px-4 text-gray-500">Min Marks</th>
            <th className="text-center py-3 px-4 text-gray-500">Max Marks</th>
          </tr></thead>
          <tbody>{boundaries.map((b, i) => (
            <tr key={b.grade} className="border-b border-gray-50">
              <td className="py-3 px-4 font-bold text-[#1B263B]">{b.grade}</td>
              <td className="py-3 px-4 text-gray-600">{b.label}</td>
              <td className="py-3 px-4 text-center">
                <input type="number" value={b.min} onChange={e => update(i, 'min', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm" />
              </td>
              <td className="py-3 px-4 text-center">
                <input type="number" value={b.max} onChange={e => update(i, 'max', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm" />
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
