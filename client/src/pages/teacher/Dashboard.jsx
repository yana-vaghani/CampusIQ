import { useState, useEffect } from 'react';
import { getAssignments } from '../../api/axios';
import StatCard from '../../components/shared/StatCard';
import { BookOpen, FileText, Clock } from 'lucide-react';

export default function TeacherDashboard() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    getAssignments({}).then(r => setAssignments(r.data));
  }, []);

  const active = assignments.filter(a => new Date(a.deadline) > new Date()).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Teacher Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Subjects Handled" value={3} icon={BookOpen} color="#1B263B" />
        <StatCard title="Active Assignments" value={active} icon={FileText} color="#415A77" />
        <StatCard title="Total Assignments" value={assignments.length} icon={Clock} color="#354F52" />
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {assignments.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText size={18} className="text-[#415A77]" />
              <div>
                <p className="text-sm font-medium text-[#1B263B]">{a.title}</p>
                <p className="text-xs text-gray-500">{a.subject_name} • Due: {new Date(a.deadline).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
