import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';

export default function AdminClassrooms() {
  const [rooms] = useState([
    { id: 1, number: 'LH-101', capacity: 60, type: 'lecture' },
    { id: 2, number: 'LH-102', capacity: 60, type: 'lecture' },
    { id: 3, number: 'Lab-201', capacity: 40, type: 'lab' },
    { id: 4, number: 'Lab-301', capacity: 30, type: 'lab' },
    { id: 5, number: 'M-204', capacity: 50, type: 'lecture' },
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Classrooms</h1>
        <button className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Plus size={16} /> Add Room</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left py-3 px-4 text-gray-500">Room</th>
            <th className="text-left py-3 px-4 text-gray-500">Capacity</th>
            <th className="text-left py-3 px-4 text-gray-500">Type</th>
          </tr></thead>
          <tbody>{rooms.map(r => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-[#1B263B]">{r.number}</td>
              <td className="py-3 px-4 text-gray-500">{r.capacity} seats</td>
              <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'lab' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{r.type}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Campus Map</h3>
        <div className="grid grid-cols-5 gap-2">
          {rooms.map(r => (
            <div key={r.id} className={`p-4 rounded-lg text-center text-sm ${r.type === 'lab' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}`}>
              <p className="font-semibold">{r.number}</p>
              <p className="text-xs text-gray-500 mt-1">{r.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
