import { useState, useEffect } from 'react';
import { getStudents, getMySubjects, getMarks, bulkSaveMarks, uploadMarksCSV } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Save, Upload, Download, BookOpen } from 'lucide-react';

const EXAM_TYPES = [
  { key: 'mid', label: 'Mid Semester', max: 25, col: 'midMarks' },
  { key: 'internal', label: 'Internal Assessment', max: 25, col: 'internalMarks' },
  { key: 'ia', label: 'IA / Projects', max: 25, col: 'iaMarks' },
  { key: 'endsem', label: 'End Semester', max: 100, col: 'endsemMarks', optional: true },
];

export default function TeacherMarks() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('mid');
  const [marksMap, setMarksMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getStudents(),
      getMySubjects(),
    ]).then(([stuRes, subRes]) => {
      if (stuRes.status === 'fulfilled') setStudents(stuRes.value.data || []);
      if (subRes.status === 'fulfilled') setSubjects(subRes.value.data || []);
      setLoading(false);
    });
  }, []);

  // Load existing marks when subject changes
  useEffect(() => {
    if (!selectedSubject || students.length === 0) return;
    // Load existing marks for each student for this subject
    const loadMarks = async () => {
      const newMap = {};
      for (const s of students) {
        try {
          const r = await getMarks(s.id);
          const subjectMarks = (r.data || []).find(m => String(m.subject_id) === String(selectedSubject));
          if (subjectMarks) {
            newMap[s.id] = {
              midMarks: subjectMarks.mid_marks || '',
              internalMarks: subjectMarks.internal_marks || '',
              iaMarks: subjectMarks.ia_marks || '',
              endsemMarks: subjectMarks.endsem_marks || '',
            };
          }
        } catch { /* skip */ }
      }
      setMarksMap(newMap);
    };
    loadMarks();
  }, [selectedSubject, students]);

  const currentExam = EXAM_TYPES.find(e => e.key === examType) || EXAM_TYPES[0];

  const setMark = (studentId, value) => {
    setMarksMap(m => ({ ...m, [studentId]: { ...m[studentId], [currentExam.col]: value } }));
  };

  const handleSave = async () => {
    if (!selectedSubject) { toast('Select a subject', 'error'); return; }
    setSaving(true);
    try {
      const marks = students.map(s => ({
        studentId: s.id,
        subjectId: parseInt(selectedSubject),
        midMarks: parseFloat(marksMap[s.id]?.midMarks) || 0,
        internalMarks: parseFloat(marksMap[s.id]?.internalMarks) || 0,
        iaMarks: parseFloat(marksMap[s.id]?.iaMarks) || 0,
        endsemMarks: marksMap[s.id]?.endsemMarks ? parseFloat(marksMap[s.id].endsemMarks) : undefined,
      }));
      await bulkSaveMarks(marks);
      toast('Marks saved successfully!', 'success');
    } catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleCSVUpload = async () => {
    if (!csvFile || !selectedSubject) { toast('Select file and subject', 'error'); return; }
    const fd = new FormData();
    fd.append('file', csvFile);
    fd.append('subjectId', selectedSubject);
    fd.append('examType', examType);
    setUploading(true);
    try {
      const r = await uploadMarksCSV(fd);
      toast(`${r.data.count} records imported`, 'success');
      setCsvFile(null);
    } catch { toast('CSV upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const handleExportCSV = () => {
    if (!selectedSubject) { toast('Select a subject first', 'error'); return; }
    window.open(`/api/marks/export/${selectedSubject}`, '_blank');
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Marks Entry</h1>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handleSave} disabled={saving || !selectedSubject} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving...' : 'Save Marks'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[200px]">
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {EXAM_TYPES.map(e => (
            <button key={e.key} onClick={() => setExamType(e.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${examType === e.key ? 'bg-white shadow-sm text-[#1B263B]' : 'text-gray-500'}`}>
              {e.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* No subjects warning */}
      {subjects.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-2">
          <BookOpen size={16} />
          No subjects assigned to your account. Please contact admin to assign subjects to you.
        </div>
      )}

      {/* CSV Upload */}
      {selectedSubject && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 flex-wrap">
          <Upload size={16} className="text-blue-500 shrink-0" />
          <span className="text-sm text-blue-700">Upload marks via CSV:</span>
          <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])}
            className="text-sm file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer" />
          {csvFile && (
            <button onClick={handleCSVUpload} disabled={uploading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
          <span className="text-xs text-blue-500">CSV columns: roll_no, marks</span>
        </div>
      )}

      {/* Marks Table */}
      {selectedSubject ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-[#1B263B]">{currentExam.label} — Out of {currentExam.max}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">#</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Roll No</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">{currentExam.label} /{currentExam.max}</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Total Internal</th>
              </tr></thead>
              <tbody>
                {students.map((s, idx) => {
                  const m = marksMap[s.id] || {};
                  const total = (parseFloat(m.midMarks)||0) + (parseFloat(m.internalMarks)||0) + (parseFloat(m.iaMarks)||0);
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-4 text-xs text-gray-400">{idx + 1}</td>
                      <td className="py-2 px-4 font-mono text-xs text-gray-500">{s.roll_no}</td>
                      <td className="py-2 px-4 font-medium text-[#1B263B]">{s.name}</td>
                      <td className="py-2 px-4">
                        <input type="number" min="0" max={currentExam.max}
                          value={m[currentExam.col] || ''}
                          onChange={e => setMark(s.id, e.target.value)}
                          placeholder={`0-${currentExam.max}`}
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B263B]" />
                      </td>
                      <td className="py-2 px-4">
                        <span className={`font-semibold ${total >= 37 ? 'text-green-600' : total >= 25 ? 'text-amber-600' : 'text-red-500'}`}>
                          {total.toFixed(1)}/75
                        </span>
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
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>Select a subject to enter marks</p>
        </div>
      )}
    </div>
  );
}
