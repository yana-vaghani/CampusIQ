import { useState, useEffect } from 'react';
import { getStudents } from '../../api/axios';
import StatCard from '../../components/shared/StatCard';
import { Users, AlertTriangle, CalendarCheck, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function MentorDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudents().then(r => setStudents(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const highRisk = students.filter(s => s.riskLevel === 'high').length;
  const medRisk = students.filter(s => s.riskLevel === 'medium').length;
  const lowRisk = students.filter(s => s.riskLevel === 'low').length;

  const pieData = [
    { name: 'Needs Attention', value: highRisk, color: '#A4161A' },
    { name: 'Moderate', value: medRisk, color: '#FFC300' },
    { name: 'On Track', value: lowRisk, color: '#354F52' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Mentor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students.length} icon={Users} color="#1B263B" />
        <StatCard title="Needs Attention" value={highRisk} icon={AlertTriangle} color="#A4161A" />
        <StatCard title="Moderate" value={medRisk} icon={TrendingUp} color="#FFC300" />
        <StatCard title="On Track" value={lowRisk} icon={CalendarCheck} color="#354F52" />
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-[#1B263B] mb-4">Academic Score Distribution</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-10">No student data yet</p>
        )}
      </div>
    </div>
  );
}
