import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentRisk, getStudentAttendance, getStudentAssignments, getTimetable } from '../../api/axios';
import StatCard from '../../components/shared/StatCard';
import RiskBadge from '../../components/shared/RiskBadge';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, GraduationCap, Clock, FileText, BookOpen, Ticket, Lightbulb, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [risk, setRisk] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [riskRes, attRes, assignRes, ttRes] = await Promise.all([
        getStudentRisk(user.studentId),
        getStudentAttendance(user.studentId),
        getStudentAssignments(user.studentId),
        getTimetable(user.section || 'A'),
      ]);
      setRisk(riskRes.data);
      setAttendance(attRes.data);
      setAssignments(assignRes.data);
      
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const today = days[new Date().getDay()];
      setTimetable(ttRes.data.filter(t => t.day === today));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LoadingSkeleton type="card" count={4} />
      </div>
    </div>
  );

  const upcomingAssignments = assignments.filter(a => a.submission_status === 'pending' || !a.submission_status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Welcome back, {user.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your academic overview for today</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Risk Score"
          value={risk?.score || 0}
          icon={AlertTriangle}
          color={risk?.level === 'high' ? '#A4161A' : risk?.level === 'medium' ? '#FFC300' : '#354F52'}
          suffix="/100"
        />
        <StatCard
          title="Attendance"
          value={attendance?.summary?.percent || 0}
          icon={CalendarCheck}
          color="#415A77"
          suffix="%"
        />
        <StatCard
          title="Avg GPA"
          value={risk?.breakdown?.averageMarks ? (risk.breakdown.averageMarks / 10).toFixed(1) : '0.0'}
          icon={GraduationCap}
          color="#354F52"
        />
        <StatCard
          title="Classes Today"
          value={timetable.length}
          icon={Clock}
          color="#1B263B"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Insights Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1B263B] font-[DM_Sans] flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#FFC300]" />
                Risk Insights
              </h3>
              <RiskBadge level={risk?.level} score={risk?.score} />
            </div>
            
            {risk?.reasons?.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {risk.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A4161A] mt-1.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No risk factors detected. Keep up the great work! 🎉</p>
            )}

            <Link to="/student/risk" className="text-sm text-[#415A77] hover:text-[#1B263B] font-medium flex items-center gap-1">
              View Full Analysis <ChevronRight size={14} />
            </Link>
          </div>

          {/* Subject Performance Chart */}
          {risk?.subjectBreakdown && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-[#1B263B] font-[DM_Sans] mb-4">Subject Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={risk.subjectBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="attendance" fill="#415A77" radius={[4,4,0,0]} name="Attendance %" />
                  <Bar dataKey="totalMarks" fill="#354F52" radius={[4,4,0,0]} name="Total Marks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Smart Suggestions */}
          {risk?.suggestions?.length > 0 && (
            <div className="bg-gradient-to-br from-[#1B263B] to-[#2d3e5c] rounded-xl p-6 text-white">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-[#FFC300]" />
                Smart Suggestions
              </h3>
              <div className="space-y-3">
                {risk.suggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="text-lg">{s.icon}</span>
                    <p>{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-[#1B263B] font-[DM_Sans] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: '/student/assignments', icon: FileText, label: 'View Assignments', count: upcomingAssignments.length },
                { to: '/student/lms', icon: BookOpen, label: 'Open Learning Hub' },
                { to: '/student/hallticket', icon: Ticket, label: 'Hall Ticket' },
              ].map(({ to, icon: Icon, label, count }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-[#415A77]" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {count > 0 && (
                      <span className="text-xs bg-[#FFC300]/20 text-[#92400e] px-2 py-0.5 rounded-full font-medium">{count}</span>
                    )}
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-[#1B263B] font-[DM_Sans] mb-4 flex items-center gap-2">
              <Clock size={18} className="text-[#415A77]" />
              Today's Classes
            </h3>
            {timetable.length === 0 ? (
              <p className="text-sm text-gray-400">No classes scheduled today</p>
            ) : (
              <div className="space-y-2">
                {timetable.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-1 h-10 rounded-full bg-[#415A77]" />
                    <div>
                      <p className="text-sm font-medium text-[#1B263B]">{t.subject_name}</p>
                      <p className="text-xs text-gray-500">{t.start_time?.slice(0,5)} - {t.end_time?.slice(0,5)} • {t.room_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
