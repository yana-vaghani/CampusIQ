import { useState } from 'react';
import { Wrench, Plus } from 'lucide-react';

export default function MentorRemedial() {
  const [sessions, setSessions] = useState([
    { id: 1, subject: 'Mathematics', students: ['Liam Chen', 'Noah Garcia'], date: '2026-04-25', time: '14:00 - 15:30', room: 'LH-101' },
    { id: 2, subject: 'Physics', students: ['Liam Chen'], date: '2026-04-27', time: '10:00 - 11:30', room: 'LH-102' },
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Remedial Classes</h1>
        <button className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Plus size={16} /> Schedule Session</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><Wrench size={20} className="text-purple-600" /></div>
              <div>
                <h4 className="font-medium text-[#1B263B]">{s.subject}</h4>
                <p className="text-xs text-gray-500 mt-1">{s.date} • {s.time} • {s.room}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {s.students.map(st => (
                    <span key={st} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{st}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
