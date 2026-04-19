import { useState, useEffect } from 'react';
import { getSubjectAttendance, markAttendance, getMySubjects, getStudents } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Save, CheckSquare, XSquare, Calendar, Users } from 'lucide-react';

export default function TeacherAttendance() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getMySubjects(),
      getStudents(),
    ]).then(([subRes, stuRes]) => {
      if (subRes.status === 'fulfilled') setSubjects(subRes.value.data || []);
      if (stuRes.status === 'fulfilled') setStudents(stuRes.value.data || []);
      setLoading(false);
    });
  }, []);

  // Load existing attendance when subject or date changes
  useEffect(() => {
    if (!selectedSubject || !date) return;
    getSubjectAttendance(selectedSubject, date).then(r => {
      const map = {};
      (r.data || []).forEach(rec => { map[rec.student_id] = rec.status; });
      setAttendance(map);
    }).catch(() => { setAttendance({}); });
  }, [selectedSubject, date]);

  const toggle = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: prev[studentId] === 'present' ? 'absent' : 'present' }));
  };

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendance(map);
  };

  const handleSave = async () => {
    if (!selectedSubject) { toast('Select a subject first', 'error'); return; }
    if (!date) { toast('Select a date', 'error'); return; }
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        subjectId: parseInt(selectedSubject),
        date: date,
        status: attendance[s.id] || 'absent',
      }));
      await markAttendance(records);
      toast('Attendance saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(s => attendance[s.id] === 'present').length;
  const absentCount = students.length - presentCount;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Mark Attendance</h1>
        <button onClick={handleSave} disabled={saving || !selectedSubject}
          className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm disabled:opacity-50 transition-all hover:bg-[#2d3e5c]">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[200px]">
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button onClick={() => markAll('present')} className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 hover:bg-green-100 transition-colors">
            <CheckSquare size={14} /> All Present
          </button>
          <button onClick={() => markAll('absent')} className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200 hover:bg-red-100 transition-colors">
            <XSquare size={14} /> All Absent
          </button>
        </div>
      </div>

      {/* No subjects warning */}
      {subjects.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ⚠️ No subjects assigned to you. Please contact admin to assign subjects.
        </div>
      )}

      {/* Summary */}
      {selectedSubject && (
        <div className="flex gap-4">
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-green-700">{presentCount}</p>
            <p className="text-xs text-green-600">Present</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            <p className="text-xs text-red-500">Absent</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-[#1B263B]">{students.length > 0 ? Math.round(presentCount/students.length*100) : 0}%</p>
            <p className="text-xs text-gray-500">Attendance Rate</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-blue-700">{students.length}</p>
            <p className="text-xs text-blue-600">Total Students</p>
          </div>
        </div>
      )}

      {/* Students Table */}
      {selectedSubject ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">#</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Roll No</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {students.map((s, idx) => {
                  const status = attendance[s.id] || 'absent';
                  return (
                    <tr key={s.id} className={`border-b border-gray-50 cursor-pointer transition-colors ${status === 'present' ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'}`}
                      onClick={() => toggle(s.id)}>
                      <td className="py-3 px-4 text-xs text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{s.roll_no}</td>
                      <td className="py-3 px-4 font-medium text-[#1B263B]">{s.name}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={e => { e.stopPropagation(); toggle(s.id); }}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {status === 'present' ? '✓ Present' : '✗ Absent'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>Select a subject to mark attendance</p>
        </div>
      )}
    </div>
  );
}
