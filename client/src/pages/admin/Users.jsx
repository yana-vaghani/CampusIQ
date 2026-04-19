import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, importUsersCSV } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { UserPlus, Trash2, Upload, Search, X, Users } from 'lucide-react';

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Mathematics', 'Physics', 'General'];
const ROLES = ['student', 'mentor', 'teacher', 'admin'];

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getUsers(filter).then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { toast('Fill all required fields', 'error'); return; }
    setSaving(true);
    try {
      await createUser(form);
      toast('User created', 'success');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'student', department: '' });
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    await deleteUser(id);
    toast('User deleted', 'success');
    load();
  };

  const handleCSVImport = async () => {
    if (!csvFile) { toast('Select a CSV file', 'error'); return; }
    const fd = new FormData();
    fd.append('file', csvFile);
    setUploading(true);
    try {
      const r = await importUsersCSV(fd);
      toast(`${r.data.count} users imported`, 'success');
      setCsvFile(null);
      load();
    } catch { toast('CSV import failed', 'error'); }
    finally { setUploading(false); }
  };

  const roleColor = (role) => ({
    student: 'bg-blue-50 text-blue-700',
    mentor: 'bg-green-50 text-green-700',
    teacher: 'bg-purple-50 text-purple-700',
    admin: 'bg-red-50 text-red-700',
  }[role] || 'bg-gray-50 text-gray-600');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">User Management</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* CSV Import */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <Upload size={16} className="text-amber-600 shrink-0" />
        <span className="text-sm text-amber-700">CSV Import:</span>
        <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])}
          className="text-sm file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:bg-amber-600 file:text-white file:cursor-pointer" />
        {csvFile && (
          <button onClick={handleCSVImport} disabled={uploading}
            className="px-3 py-1 bg-amber-600 text-white rounded text-sm disabled:opacity-50">
            {uploading ? 'Importing...' : 'Import'}
          </button>
        )}
        <span className="text-xs text-amber-500">Columns: name, email, password, role, department</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))}
            placeholder="Search by name or email..." className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filter.role} onChange={e => setFilter(f => ({...f, role: e.target.value}))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-4 space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-10 bg-gray-100 rounded" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Department</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Joined</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium"></th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-[#1B263B]">{u.name}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{u.email}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColor(u.role)}`}>{u.role}</span></td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{u.department || '—'}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4"><button onClick={() => handleDelete(u.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-5">
              <h3 className="font-semibold text-[#1B263B]">Add User</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
              placeholder="Full name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
              placeholder="Email *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
              placeholder="Password *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm capitalize">
                  {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Department</label>
                <select value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleCreate} disabled={saving}
              className="w-full py-2.5 bg-[#1B263B] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
