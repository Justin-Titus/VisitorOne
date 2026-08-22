import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../../components/shared/AnimatedPage';
import VisitorBadgeCard from '../../components/ui/VisitorBadgeCard';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  UserPlus,
  User,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Briefcase,
  Calendar,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { getTodayString } from '../../utils/helpers';

export default function RegisterVisitor() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMobileBadge, setShowMobileBadge] = useState(false);
  const [form, setForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    visitorCompany: '',
    idProofType: '',
    idProofNumber: '',
    employeeToVisit: '',
    purpose: '',
    visitDate: getTodayString(),
    expectedArrivalTime: '',
  });

  useEffect(() => {
    api.get('/employees').then((res) => {
      setEmployees(res.data.data.filter((e) => e.status === 'active'));
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const selectedEmployee = employees.find((e) => e._id === form.employeeToVisit);

  const isFormValid =
    Boolean(form.visitorName?.trim()) &&
    Boolean(form.visitorPhone?.trim()) &&
    Boolean(form.employeeToVisit?.trim()) &&
    Boolean(form.purpose?.trim()) &&
    Boolean(form.visitDate?.trim()) &&
    Boolean(form.expectedArrivalTime?.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    try {
      await api.post('/visitor-requests', {
        visitorData: {
          name: form.visitorName,
          phone: form.visitorPhone,
          email: form.visitorEmail || undefined,
          company: form.visitorCompany || undefined,
          idProofType: form.idProofType || undefined,
          idProofNumber: form.idProofNumber || undefined,
        },
        employeeToVisit: form.employeeToVisit,
        purpose: form.purpose,
        visitDate: form.visitDate,
        expectedArrivalTime: form.expectedArrivalTime,
      });
      toast.success('Visitor pass request generated successfully!');
      navigate('/visitor-requests');
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  // Mock request object for live badge pass preview
  const previewReq = {
    _id: 'PREVIEW' + Date.now().toString().slice(-4),
    status: 'pending',
    visitor: {
      name: form.visitorName || 'Visitor Name',
      phone: form.visitorPhone || '+91 ••••• •••••',
      company: form.visitorCompany || 'Company / Organization',
    },
    employeeToVisit: {
      name: selectedEmployee ? selectedEmployee.name : 'Select Host Employee',
      department: selectedEmployee ? selectedEmployee.department : 'Host Department',
    },
    purpose: form.purpose || 'Official Visit Purpose',
    visitDate: form.visitDate || new Date().toISOString(),
    expectedArrivalTime: form.expectedArrivalTime || '10:00 AM',
  };

  return (
    <AnimatedPage className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserPlus className="text-indigo-600 dark:text-indigo-400" size={24} />
            Issue Visitor Pass
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Register visitor credentials and generate a digital access pass
          </p>
        </div>
      </div>

      {/* Split Screen Form & Live Badge Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {/* Section 1: Visitor Info */}
          <div className="bento-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/[0.04]">
              <User size={16} className="text-indigo-600 dark:text-indigo-400" />
              1. Visitor Credentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="visitorName"
                    value={form.visitorName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Alex Morgan"
                    className="input-field pl-8.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="visitorPhone"
                    value={form.visitorPhone}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 9876543210"
                    className="input-field pl-8.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    name="visitorEmail"
                    value={form.visitorEmail}
                    onChange={handleChange}
                    placeholder="alex@company.com"
                    className="input-field pl-8.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization
                </label>
                <div className="relative">
                  <Building2
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="visitorCompany"
                    value={form.visitorCompany}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    className="input-field pl-8.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID Proof Type
                </label>
                <select
                  name="idProofType"
                  value={form.idProofType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select ID type...</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="other">Other Official ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID Document Number
                </label>
                <div className="relative">
                  <CreditCard
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="idProofNumber"
                    value={form.idProofNumber}
                    onChange={handleChange}
                    placeholder="XXXX-XXXX-XXXX"
                    className="input-field pl-8.5 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Visit Details */}
          <div className="bento-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/[0.04]">
              <Briefcase size={16} className="text-indigo-600 dark:text-indigo-400" />
              2. Visit & Host Authorization
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Host Employee to Visit *
                </label>
                <select
                  name="employeeToVisit"
                  value={form.employeeToVisit}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select employee host...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — {emp.department} ({emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Purpose of Visit *
                </label>
                <input
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Client product demonstration & quarterly review"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Visit Date *
                </label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    name="visitDate"
                    value={form.visitDate}
                    onChange={handleChange}
                    required
                    className="input-field pl-8.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Arrival Time *
                </label>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                  />
                  <input
                    type="time"
                    name="expectedArrivalTime"
                    value={form.expectedArrivalTime}
                    onChange={handleChange}
                    required
                    className="input-field pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`btn-cyber !px-5 !py-2.5 text-xs font-bold transition-all duration-150 ${
                !isFormValid || loading
                  ? 'opacity-50 cursor-not-allowed shadow-none hover:!bg-indigo-600 active:!scale-100'
                  : 'cursor-pointer hover:shadow-lg'
              }`}
              title={!isFormValid ? 'Please fill all required visitor and host details to issue pass' : 'Issue Visitor Pass'}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>{loading ? 'Generating Pass...' : 'Issue Visitor Pass'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary !px-4 !py-2.5 text-xs"
            >
              Cancel
            </button>
            {/* Mobile badge preview toggle */}
            <button
              type="button"
              onClick={() => setShowMobileBadge(!showMobileBadge)}
              className="lg:hidden btn-secondary !px-4 !py-2.5 text-xs flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-indigo-500" />
              {showMobileBadge ? 'Hide Preview' : 'Preview Badge'}
            </button>
          </div>

          {/* Mobile-only badge preview (collapsible) */}
          {showMobileBadge && (
            <div className="lg:hidden mt-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                  <Sparkles size={13} className="text-indigo-500" /> Live Badge Preview
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={12} /> Auto-Syncing
                </span>
              </div>
              <VisitorBadgeCard req={previewReq} userRole="preview" isInteractive={true} />
              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-mono">
                Badge pass will be instantly issued and verifiable upon registration.
              </p>
            </div>
          )}
        </form>

        {/* Live Badge Pass Preview Column */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
              <Sparkles size={13} className="text-indigo-500" /> Live Badge Preview
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} /> Auto-Syncing
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08]">
            <VisitorBadgeCard req={previewReq} userRole="preview" isInteractive={true} />
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-3 font-mono">
              Badge pass will be instantly issued and verifiable upon registration.
            </p>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}

