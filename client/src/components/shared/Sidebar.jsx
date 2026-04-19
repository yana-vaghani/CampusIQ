import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, AlertTriangle, CalendarCheck, BookOpen, FileText,
  Clock, Users, GraduationCap, Ticket, UserCog, BarChart3,
  ClipboardList, Wrench, Upload, Settings, Calendar, Building2,
  LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = {
  student: [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/risk', label: 'Risk Analysis', icon: AlertTriangle },
    { path: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { path: '/student/lms', label: 'Learning Hub', icon: BookOpen },
    { path: '/student/assignments', label: 'Assignments', icon: FileText },
    { path: '/student/schedule', label: 'Schedule', icon: Clock },
    { path: '/student/faculty', label: 'Faculty', icon: Users },
    { path: '/student/grades', label: 'Grades', icon: GraduationCap },
    { path: '/student/hallticket', label: 'Hall Ticket', icon: Ticket },
  ],
  mentor: [
    { path: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/mentor/students', label: 'Students', icon: Users },
    { path: '/mentor/interventions', label: 'Interventions', icon: ClipboardList },
    { path: '/mentor/remedial', label: 'Remedial Classes', icon: Wrench },
  ],
  teacher: [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
    { path: '/teacher/lms', label: 'LMS Content', icon: Upload },
    { path: '/teacher/assignments', label: 'Assignments', icon: FileText },
    { path: '/teacher/marks', label: 'Marks Entry', icon: BarChart3 },
    { path: '/teacher/grades', label: 'Grade Settings', icon: GraduationCap },
  ],
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: UserCog },
    { path: '/admin/timetable', label: 'Timetable', icon: Clock },
    { path: '/admin/classrooms', label: 'Classrooms', icon: Building2 },
    { path: '/admin/hallticket', label: 'Hall Ticket Rules', icon: Ticket },
    { path: '/admin/events', label: 'Events', icon: Calendar },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const items = navItems[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabels = { student: 'Student', mentor: 'Faculty Mentor', teacher: 'Subject Teacher', admin: 'Administrator' };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-[#1B263B] text-white flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FFC300] to-[#FF8C00] flex items-center justify-center font-bold text-[#1B263B] text-sm flex-shrink-0">
          CQ
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold tracking-tight font-[DM_Sans]">CampusIQ</h1>
            <p className="text-[11px] text-white/50">{roleLabels[user?.role]}</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1B263B] border-2 border-[#354F52] flex items-center justify-center hover:bg-[#354F52] transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {items.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/15 text-[#FFC300] font-semibold shadow-lg shadow-white/5'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="animate-fade-in">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#415A77] to-[#354F52] flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[11px] text-white/50 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mt-3 w-full px-3 py-2 text-sm text-white/60 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
