import { useState, useEffect } from 'react';
import { getStudents } from '../../api/axios';
import StatCard from '../../components/shared/StatCard';
import { Users, AlertTriangle, CalendarCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function MentorDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudents().then(r => setStudents(r.data)).finally(() => setLoading(false));
  }, []);

  const highRisk = students.filter(s => s.riskLevel === 'high').length;
  const medRisk = students.filter(s => s.riskLevel === 'medium').length;
  const lowRisk = students.filter(s => s.riskLevel === 'low').length;

  const pieData = [
    { name: 'High Risk', value: highRisk, color: '#A4161A' },
    { name: 'Medium Risk', value: medRisk, color: '#FFC300' },
    { name: 'Low Risk', value: lowRisk, color: '#354F52' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Mentor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} color="#1B263B" />
        <StatCard title="High Risk" value={highRisk} icon={AlertTriangle} color="#A4161A" />
        <StatCard title="Low Attendance" value={students.filter(s => s.riskLevel !== 'low').length} icon={CalendarCheck} color="#FFC300" />
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
