import { useState, useEffect, useCallback } from 'react';
import AnimatedPage from '../../components/shared/AnimatedPage';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Plus, Edit, ToggleLeft, ToggleRight, UserCog, Search, Shield, ShieldCheck } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const ROLES = ['admin', 'receptionist', 'employee'];

const roleTabs = [
  { id: 'all', label: 'All Users' },
  { id: 'admin', label: 'Admins' },
  { id: 'receptionist', label: 'Reception' },
  { id: 'employee', label: 'Employees' },
];

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist',
    employeeRef: '',
  });

  const fetchAll = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [uRes, eRes] = await Promise.all([api.get('/users'), api.get('/employees')]);
      setUsers(uRes.data.data);
      setEmployees(eRes.data.data.filter((e) => e.status === 'active'));
    } catch {
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'receptionist', employeeRef: '' });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      employeeRef: user.employeeRef?._id || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (!editUser) payload.password = form.password;
      if (form.role === 'employee') payload.employeeRef = form.employeeRef;

      if (editUser) {
        await api.put(`/users/${editUser._id}`, payload);
        toast.success('User credentials updated');
      } else {
        await api.post('/users', payload);
        toast.success('User account created');
      }
      setModalOpen(false);
      fetchAll(true);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    if (user.role === 'admin') {
      toast.error('Admin accounts cannot be deactivated to prevent system lockout');
      return;
    }
    if (user._id === currentUser?._id) {
      toast.error('You cannot deactivate your own account');
      return;
    }
    // Optimistic local state toggle for instant smooth feedback
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
    );
    try {
      await api.patch(`/users/${user._id}/status`);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchAll(true);
    } catch {
      fetchAll(true);
    }
  };

  const roleBadgeStyles = {
    admin: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    receptionist: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    employee: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AnimatedPage className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCog className="text-indigo-600 dark:text-indigo-400" size={24} />
            User Accounts & Security Roles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage authentication credentials, access privileges, and account status
          </p>
        </div>

        <button onClick={openCreate} className="btn-cyber text-xs font-bold self-start sm:self-auto">
          <Plus size={14} /> Add System User
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Role Pill Toggle */}
        <div className="relative inline-flex items-center p-1 bg-slate-200/70 dark:bg-white/[0.05] rounded-xl border border-slate-300/60 dark:border-white/[0.08] select-none self-start">
          {roleTabs.map((tab) => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="userRoleFilterPill"
                    className="absolute inset-0 bg-white dark:bg-[#111726] rounded-lg shadow-xs border border-slate-200/80 dark:border-white/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            placeholder="Search accounts by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-xs w-full"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading system credentials..." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No user accounts found" />
      ) : (
        <div className="bento-card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-black/20 border-b border-slate-200 dark:border-white/[0.06]">
                  {['User Identity', 'Clearance Role', 'Linked Employee', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
                {filtered.map((user, i) => {
                  const isSelfOrAdmin = user.role === 'admin' || user._id === currentUser?._id;
                  return (
                    <motion.tr key={user._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold font-mono shadow-xs border border-indigo-400/20">{user.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold uppercase border ${roleBadgeStyles[user.role] || roleBadgeStyles.employee}`}>
                          <Shield size={10} />{user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {user.employeeRef?.name ? <span className="font-medium text-slate-800 dark:text-slate-200">{user.employeeRef.name}</span> : <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${user.isActive ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'}`}>
                          {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(user)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors" title="Edit User"><Edit size={13} /></button>
                          <button onClick={() => toggleStatus(user)} disabled={isSelfOrAdmin} title={isSelfOrAdmin ? 'Admin / Self accounts cannot be deactivated' : 'Toggle account status'} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelfOrAdmin ? 'opacity-40 cursor-not-allowed bg-slate-500/10 text-slate-400' : user.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'}`}>
                            {user.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filtered.map((user, i) => {
              const isSelfOrAdmin = user.role === 'admin' || user._id === currentUser?._id;
              return (
                <motion.div key={user._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{user.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(user)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><Edit size={13} /></button>
                      <button onClick={() => toggleStatus(user)} disabled={isSelfOrAdmin} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelfOrAdmin ? 'opacity-40 cursor-not-allowed bg-slate-500/10 text-slate-400' : user.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'}`}>
                        {user.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold uppercase border ${roleBadgeStyles[user.role] || roleBadgeStyles.employee}`}><Shield size={10} />{user.role}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${user.isActive ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'}`}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                    {user.employeeRef?.name && <span className="text-[11px] text-slate-500 dark:text-slate-400">↳ {user.employeeRef.name}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editUser ? 'Edit User Credentials' : 'Create User Account'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="input-field"
              placeholder="e.g. Marcus Vance"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="input-field"
              placeholder="marcus@visitorone.com"
            />
          </div>
          {!editUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Access Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="input-field font-mono"
                placeholder="••••••••"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clearance Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input-field"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {form.role === 'employee' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Link to Staff Profile *
              </label>
              <select
                value={form.employeeRef}
                onChange={(e) => setForm({ ...form, employeeRef: e.target.value })}
                required
                className="input-field"
              >
                <option value="">Select matching employee...</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} — {e.department} ({e.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2.5 pt-2">
            <button type="submit" disabled={saving} className="btn-cyber text-xs">
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>{editUser ? 'Update Account' : 'Create User'}</span>
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </AnimatedPage>
  );
}

