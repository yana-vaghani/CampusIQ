import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Student', email: 'aarav.shah@college.edu', color: '#354F52' },
    { label: 'Mentor', email: 'anjali.mehta@college.edu', color: '#415A77' },
    { label: 'Teacher', email: 'vikram.singh@college.edu', color: '#1B263B' },
    { label: 'Admin', email: 'admin@college.edu', color: '#FFC300' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">CampusIQ</h2>
          <p className="text-gray-500 mt-1 mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-[#A4161A] rounded-lg mb-4 text-sm border border-red-100">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B263B]/20 focus:border-[#1B263B] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B263B]/20 focus:border-[#1B263B] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1B263B] text-white rounded-lg font-medium text-sm hover:bg-[#2d3e5c] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                onClick={() => { setEmail(acc.email); setPassword('Demo@123'); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color, flexShrink: 0 }} />
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-gray-700">{acc.label}</p>
                  <p className="text-[10px] text-gray-400 truncate w-full" title={acc.email}>{acc.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
