import { useState, useEffect } from 'react';
import { getUsers } from '../../api/axios';
import StatCard from '../../components/shared/StatCard';
import { Users, GraduationCap, AlertTriangle, CalendarCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => { getUsers({}).then(r => setUsers(r.data)); }, []);

  const students = users.filter(u => u.role === 'student').length;
  const faculty = users.filter(u => ['teacher', 'mentor'].includes(u.role)).length;

  const deptData = [
    { dept: 'CS', high: 2, medium: 2, low: 2 },
    { dept: 'Physics', high: 1, medium: 1, low: 1 },
    { dept: 'Math', high: 0, medium: 2, low: 1 },
  ];

  const weeklyData = [
    { week: 'W1', users: 15 }, { week: 'W2', users: 18 },
    { week: 'W3', users: 22 }, { week: 'W4', users: 20 },
    { week: 'W5', users: 25 }, { week: 'W6', users: 28 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students} icon={GraduationCap} color="#1B263B" />
        <StatCard title="Total Faculty" value={faculty} icon={Users} color="#415A77" />
        <StatCard title="High Risk Students" value={2} icon={AlertTriangle} color="#A4161A" />
        <StatCard title="Avg Attendance" value={72} icon={CalendarCheck} color="#354F52" suffix="%" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4">Risk by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="high" fill="#A4161A" stackId="a" name="High Risk" radius={[0,0,0,0]} />
              <Bar dataKey="medium" fill="#FFC300" stackId="a" name="Medium" />
              <Bar dataKey="low" fill="#354F52" stackId="a" name="Low Risk" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1B263B] mb-4">Weekly Active Users</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#1B263B" strokeWidth={2} dot={{ fill: '#1B263B', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
