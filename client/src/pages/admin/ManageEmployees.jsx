import { useState, useEffect, useCallback } from 'react';
import AnimatedPage from '../../components/shared/AnimatedPage';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  ToggleLeft,
  ToggleRight,
  Users,
  Search,
  Building2,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

const statusTabs = [
  { id: 'all', label: 'All Staff' },
  { id: 'active', label: 'Active Only' },
  { id: 'inactive', label: 'Inactive' },
];

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    employeeCode: '',
    department: '',
    designation: '',
    email: '',
    phone: '',
  });

  const fetchEmployees = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/employees');
      setEmployees(res.data.data);
    } catch {
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openCreate = () => {
    setEditEmployee(null);
    setForm({
      name: '',
      employeeCode: '',
      department: '',
      designation: '',
      email: '',
      phone: '',
    });
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditEmployee(emp);
    setForm({
      name: emp.name,
      employeeCode: emp.employeeCode,
      department: emp.department,
      designation: emp.designation || '',
      email: emp.email,
      phone: emp.phone,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editEmployee) {
        await api.put(`/employees/${editEmployee._id}`, form);
        toast.success('Staff profile updated');
      } else {
        await api.post('/employees', form);
        toast.success('New employee added');
      }
      setModalOpen(false);
      fetchEmployees(true);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (emp) => {
    // Optimistic local state toggle
    setEmployees((prev) =>
      prev.map((e) =>
        e._id === emp._id
          ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' }
          : e
      )
    );
    try {
      await api.patch(`/employees/${emp._id}/status`);
      toast.success(`Employee ${emp.status === 'active' ? 'deactivated' : 'activated'}`);
      fetchEmployees(true);
    } catch {
      fetchEmployees(true);
    }
  };

  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.department.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AnimatedPage className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
            Staff & Host Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage organization employees authorized to host visitors
          </p>
        </div>

        <button onClick={openCreate} className="btn-cyber text-xs font-bold self-start sm:self-auto">
          <Plus size={14} /> Add New Employee
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pill Toggle */}
        <div className="relative inline-flex items-center p-1 bg-slate-200/70 dark:bg-white/[0.05] rounded-xl border border-slate-300/60 dark:border-white/[0.08] select-none self-start">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="employeeStatusPill"
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
            placeholder="Filter staff by name, code, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-xs w-full"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Loader text="Loading staff records..." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No employee profiles found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp, i) => (
            <motion.div
              key={emp._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bento-card p-4.5 group hover:border-indigo-500/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-sm font-bold shadow-xs border border-indigo-400/20 font-mono">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                        {emp.designation || 'Staff'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(emp)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => toggleStatus(emp)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        emp.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                      }`}
                      title="Toggle Status"
                    >
                      {emp.status === 'active' ? (
                        <ToggleRight size={14} />
                      ) : (
                        <ToggleLeft size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {emp.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <Phone size={13} className="text-slate-400 flex-shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.04] text-[11px] font-mono">
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                  <Hash size={11} />
                  {emp.employeeCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md font-semibold capitalize ${
                    emp.status === 'active'
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {emp.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEmployee ? 'Edit Staff Profile' : 'Add Employee'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input-field"
                placeholder="e.g. Rachel Adams"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee Code *
              </label>
              <input
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                required
                className="input-field font-mono"
                placeholder="EMP-104"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
                className="input-field"
                placeholder="Engineering"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="input-field"
                placeholder="Lead Architect"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="input-field font-mono"
                placeholder="9876543210"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input-field"
                placeholder="rachel@visitorone.com"
              />
            </div>
          </div>
          <div className="flex gap-2.5 pt-2">
            <button type="submit" disabled={saving} className="btn-cyber text-xs">
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>{editEmployee ? 'Save Changes' : 'Add Employee'}</span>
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

