import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStudent, getStudentRisk, getStudentInterventions, createIntervention } from '../../api/axios';
import RiskBadge from '../../components/shared/RiskBadge';
import { useToast } from '../../components/shared/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Plus, X } from 'lucide-react';

export default function StudentDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [student, setStudent] = useState(null);
  const [risk, setRisk] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'counseling', remarks: '' });

  useEffect(() => {
    Promise.all([
      getStudent(id).then(r => setStudent(r.data)),
      getStudentRisk(id).then(r => setRisk(r.data)),
      getStudentInterventions(id).then(r => setInterventions(r.data)),
    ]);
  }, [id]);

  const handleCreate = async () => {
    try {
      await createIntervention({ studentId: parseInt(id), type: form.type, remarks: form.remarks });
      toast('Intervention assigned', 'success');
      setShowModal(false);
      setForm({ type: 'counseling', remarks: '' });
      getStudentInterventions(id).then(r => setInterventions(r.data));
    } catch { toast('Failed to create intervention', 'error'); }
  };

  if (!student) return <div className="animate-pulse bg-white rounded-xl h-64" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[#1B263B]/10 flex items-center justify-center">
          <User size={28} className="text-[#1B263B]" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1B263B]">{student.name}</h1>
          <p className="text-sm text-gray-500">{student.roll_no} • Sem {student.semester} • Section {student.section}</p>
          <p className="text-sm text-gray-400">{student.department} • Mentor: {student.mentor_name}</p>
        </div>
        <RiskBadge level={risk?.level} score={risk?.score} size="lg" />
      </div>

      {risk?.subjectBreakdown && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4">Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={risk.subjectBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="attendance" fill="#415A77" name="Attendance %" radius={[4,4,0,0]} />
              <Bar dataKey="totalMarks" fill="#354F52" name="Total Marks" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1B263B]">Interventions</h3>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-[#1B263B] text-white rounded-lg text-sm"><Plus size={14} /> Assign</button>
        </div>
        {interventions.length === 0 ? <p className="text-sm text-gray-400">No interventions yet</p> : (
          <div className="space-y-3">{interventions.map(i => (
            <div key={i.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${i.type === 'counseling' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{i.type}</span>
                <span className="text-xs text-gray-400">{new Date(i.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">{i.remarks}</p>
            </div>
          ))}</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold text-[#1B263B]">Assign Intervention</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="counseling">Counseling</option>
              <option value="remedial">Remedial</option>
            </select>
            <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Remarks..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24 mb-3" />
            <button onClick={handleCreate} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm">Save Intervention</button>
          </div>
        </div>
      )}
    </div>
  );
}
