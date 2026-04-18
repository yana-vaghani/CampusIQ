import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentMarks } from '../../api/axios';
import { calculateGrade, calculateTotal, getGradeInsight, GRADE_BOUNDARIES } from '../../utils/gradeCalc';
import { GraduationCap, Lightbulb } from 'lucide-react';

export default function StudentGrades() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [simEndSem, setSimEndSem] = useState(50);

  useEffect(() => {
    getStudentMarks(user.studentId).then(r => { setMarks(r.data); if (r.data.length > 0) setSelectedSubject(r.data[0]); });
  }, []);

  const simTotal = selectedSubject ? parseFloat(selectedSubject.mid_marks) + parseFloat(selectedSubject.internal_marks) + (simEndSem / 2) : 0;
  const simGrade = calculateGrade(simTotal);
  const insights = selectedSubject ? getGradeInsight(selectedSubject.mid_marks, selectedSubject.internal_marks) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Grades</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Marks Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500">Subject</th>
              <th className="text-center py-3 px-4 text-gray-500">Mid (/25)</th>
              <th className="text-center py-3 px-4 text-gray-500">Internal (/25)</th>
              <th className="text-center py-3 px-4 text-gray-500">End Sem (/50)</th>
              <th className="text-center py-3 px-4 text-gray-500">Total (/100)</th>
              <th className="text-center py-3 px-4 text-gray-500">Grade</th>
            </tr></thead>
            <tbody>{marks.map(m => {
              const total = calculateTotal(m.mid_marks, m.internal_marks, m.endsem_marks);
              const grade = calculateGrade(total);
              return (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedSubject(m); setSimEndSem(parseFloat(m.endsem_marks)); }}>
                  <td className="py-3 px-4 font-medium text-[#1B263B]">{m.subject_name}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(m.mid_marks).toFixed(1)}</td>
                  <td className="py-3 px-4 text-center">{parseFloat(m.internal_marks).toFixed(1)}</td>
                  <td className="py-3 px-4 text-center">{(parseFloat(m.endsem_marks) / 2).toFixed(1)}</td>
                  <td className="py-3 px-4 text-center font-semibold">{total.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${grade.className}`}>{grade.grade}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedSubject && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-[#1B263B] mb-4 flex items-center gap-2"><GraduationCap size={18} /> Grade Simulator — {selectedSubject.subject_name}</h3>
            <p className="text-sm text-gray-500 mb-2">Mid: {parseFloat(selectedSubject.mid_marks).toFixed(1)} + Internal: {parseFloat(selectedSubject.internal_marks).toFixed(1)} = {(parseFloat(selectedSubject.mid_marks) + parseFloat(selectedSubject.internal_marks)).toFixed(1)}/50</p>
            <label className="text-sm font-medium text-gray-700">Simulate End-Sem Marks: {simEndSem}/100</label>
            <input type="range" min="0" max="100" value={simEndSem} onChange={e => setSimEndSem(parseInt(e.target.value))} className="w-full mt-2 accent-[#1B263B]" />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Projected Total</p>
              <p className="text-3xl font-bold text-[#1B263B]">{simTotal.toFixed(1)}/100</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold ${simGrade.className}`}>{simGrade.grade} — {simGrade.label}</span>
            </div>
          </div>
        )}

        {insights.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-[#1B263B] mb-4 flex items-center gap-2"><Lightbulb size={18} className="text-[#FFC300]" /> Smart Insights</h3>
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${calculateGrade(ins.neededEndSem).className}`}>{ins.grade}</span>
                  <p className="text-sm text-gray-700">Score <strong>{ins.neededEndSem}/100</strong> in End-Sem for <strong>{ins.label}</strong></p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Grade Boundaries</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {GRADE_BOUNDARIES.map(b => (
            <div key={b.grade} className={`p-3 rounded-lg text-center ${calculateGrade(b.min).className}`}>
              <p className="text-lg font-bold">{b.grade}</p>
              <p className="text-xs opacity-80">{b.min}–{b.max}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
