import { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser } from '../../api/axios';
import { useToast } from '../../components/shared/Toast';
import { Search, Plus, Trash2, X, Upload } from 'lucide-react';

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '' });

  useEffect(() => {
    getUsers({ search, role: roleFilter || undefined }).then(r => setUsers(r.data));
  }, [search, roleFilter]);

  const handleCreate = async () => {
    try {
      await createUser(form);
      toast('User created', 'success');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'student', department: '' });
      getUsers({}).then(r => setUsers(r.data));
    } catch (e) { toast(e.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    await deleteUser(id);
    toast('User deleted', 'success');
    getUsers({ search, role: roleFilter || undefined }).then(r => setUsers(r.data));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B263B] font-[DM_Sans]">User Management</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"><Upload size={16} /> CSV Import</button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#1B263B] text-white rounded-lg text-sm"><Plus size={16} /> Add User</button>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="mentor">Mentor</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left py-3 px-4 text-gray-500">Name</th>
            <th className="text-left py-3 px-4 text-gray-500">Email</th>
            <th className="text-left py-3 px-4 text-gray-500">Role</th>
            <th className="text-left py-3 px-4 text-gray-500">Department</th>
            <th className="text-left py-3 px-4 text-gray-500">Actions</th>
          </tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-[#1B263B]">{u.name}</td>
              <td className="py-3 px-4 text-gray-500">{u.email}</td>
              <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#1B263B]/10 text-[#1B263B] capitalize">{u.role}</span></td>
              <td className="py-3 px-4 text-gray-500">{u.department}</td>
              <td className="py-3 px-4"><button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h3 className="font-semibold">Add User</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password" type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
              <option value="student">Student</option><option value="mentor">Mentor</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
            </select>
            <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="Department" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <button onClick={handleCreate} className="w-full py-2 bg-[#1B263B] text-white rounded-lg text-sm">Create User</button>
          </div>
        </div>
      )}
    </div>
  );
}
