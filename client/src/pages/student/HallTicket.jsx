import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentHallTicket } from '../../api/axios';
import { Ticket, CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';

export default function StudentHallTicket() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentHallTicket(user.studentId).then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse bg-white rounded-xl h-64" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Hall Ticket</h1>
      <div className={`rounded-xl p-8 text-center ${data?.eligible ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
        {data?.eligible ? (
          <>
            <CheckCircle size={48} className="mx-auto text-[#354F52] mb-4" />
            <h2 className="text-2xl font-bold text-[#354F52]">✅ Eligible</h2>
            <p className="text-gray-600 mt-2">You meet the minimum attendance requirement of {data.minAttendance}%</p>
            <button className="mt-6 px-6 py-2.5 bg-[#354F52] text-white rounded-lg font-medium hover:bg-[#2d4043] flex items-center gap-2 mx-auto">
              <Download size={18} /> Download Hall Ticket
            </button>
          </>
        ) : (
          <>
            <XCircle size={48} className="mx-auto text-[#A4161A] mb-4" />
            <h2 className="text-2xl font-bold text-[#A4161A]">❌ Not Eligible</h2>
            <p className="text-gray-600 mt-2">You do not meet the minimum attendance requirement of {data?.minAttendance}%</p>
          </>
        )}
      </div>
      {data?.ineligibleSubjects?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-[#A4161A]" />Insufficient Attendance</h3>
          <div className="space-y-3">
            {data.ineligibleSubjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800">{s.subject} ({s.code})</span>
                <span className="text-sm text-red-600 font-semibold">{s.attendance}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data?.student && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4">Student Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{data.student.name}</span></div>
            <div><span className="text-gray-500">Roll No:</span> <span className="font-medium">{data.student.roll_no}</span></div>
            <div><span className="text-gray-500">Semester:</span> <span className="font-medium">{data.student.semester}</span></div>
            <div><span className="text-gray-500">Section:</span> <span className="font-medium">{data.student.section}</span></div>
            <div><span className="text-gray-500">Department:</span> <span className="font-medium">{data.student.department}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
