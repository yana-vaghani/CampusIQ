import { useState, useEffect } from 'react';
import { getStudents, bulkSaveMarks } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Save, Upload } from 'lucide-react';

export default function TeacherMarks() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [subjectId, setSubjectId] = useState(1);
  const [marks, setMarks] = useState({});

  useEffect(() => {
    getStudents().then(r => {
      setStudents(r.data);
      const m = {};
      r.data.forEach(s => { m[s.id] = { midMarks: 0, internalMarks: 0, endsemMarks: 0 }; });
      setMarks(m);
    });
  }, []);

  const updateMark = (studentId, field, value) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: parseFloat(value) || 0 } }));
  };

  const handleSave = async () => {
    const data = Object.entries(marks).map(([studentId, m]) => ({ studentId: parseInt(studentId), subjectId, ...m }));
    try {
      await bulkSaveMarks(data);
      toast('Marks saved successfully', 'success');
    } catch { toast('Failed to save marks', 'error'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Marks Entry</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"><Upload size={16} /> Upload CSV</button>
          <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Save size={16} /> Save Marks</button>
        </div>
      </div>
      <div className="flex gap-2">
        {[{id:1,name:'Mathematics'},{id:2,name:'Physics'},{id:3,name:'Computer Science'}].map(s => (
          <button key={s.id} onClick={() => setSubjectId(s.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${subjectId === s.id ? 'bg-[#1B263B] text-white' : 'bg-white border border-gray-200'}`}>{s.name}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left py-3 px-4 text-gray-500">Student</th>
            <th className="text-left py-3 px-4 text-gray-500">Roll No</th>
            <th className="text-center py-3 px-4 text-gray-500">Mid (/25)</th>
            <th className="text-center py-3 px-4 text-gray-500">Internal (/25)</th>
            <th className="text-center py-3 px-4 text-gray-500">End Sem (/100)</th>
          </tr></thead>
          <tbody>{students.map(s => (
            <tr key={s.id} className="border-b border-gray-50">
              <td className="py-2 px-4 font-medium text-[#1B263B]">{s.name}</td>
              <td className="py-2 px-4 text-gray-500">{s.roll_no}</td>
              <td className="py-2 px-4 text-center">
                <input type="number" min="0" max="25" value={marks[s.id]?.midMarks || ''} onChange={e => updateMark(s.id, 'midMarks', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm" />
              </td>
              <td className="py-2 px-4 text-center">
                <input type="number" min="0" max="25" value={marks[s.id]?.internalMarks || ''} onChange={e => updateMark(s.id, 'internalMarks', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm" />
              </td>
              <td className="py-2 px-4 text-center">
                <input type="number" min="0" max="100" value={marks[s.id]?.endsemMarks || ''} onChange={e => updateMark(s.id, 'endsemMarks', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm" />
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
