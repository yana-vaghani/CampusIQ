import { useState, useEffect } from 'react';
import { getHallTicketRules, updateHallTicketRules } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Save, Ticket } from 'lucide-react';

export default function AdminHallTicket() {
  const { toast } = useToast();
  const [rules, setRules] = useState({ min_attendance_percent: 75, enabled: true });

  useEffect(() => {
    getHallTicketRules().then(r => setRules(r.data));
  }, []);

  const handleSave = async () => {
    try {
      await updateHallTicketRules({ minAttendancePercent: rules.min_attendance_percent, enabled: rules.enabled });
      toast('Rules updated', 'success');
    } catch { toast('Failed', 'error'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">Hall Ticket Rules</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Ticket size={24} className="text-[#1B263B]" />
          <h3 className="font-semibold text-[#1B263B]">Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Attendance %</label>
            <input type="number" min="0" max="100" value={rules.min_attendance_percent} onChange={e => setRules({...rules, min_attendance_percent: parseFloat(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Enable Hall Ticket Generation</span>
            <button onClick={() => setRules({...rules, enabled: !rules.enabled})} className={`w-12 h-6 rounded-full transition-colors ${rules.enabled ? 'bg-[#354F52]' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${rules.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Save size={16} /> Apply Rules</button>
        </div>
      </div>
    </div>
  );
}
