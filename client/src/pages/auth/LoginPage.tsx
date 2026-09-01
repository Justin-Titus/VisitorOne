import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DemoProfile {
  id: string;
  label: string;
  roleName: string;
  badgeClass: string;
  email: string;
  pass: string;
}

const demoProfiles: DemoProfile[] = [
  { id: 'admin', label: 'Admin', roleName: 'Super Admin', badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', email: 'admin@visitorone.com', pass: 'Admin@123' },
  { id: 'reception', label: 'Reception', roleName: 'Front Desk', badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', email: 'reception@visitorone.com', pass: 'Reception@123' },
  { id: 'alice', label: 'Alice', roleName: 'Engineering', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', email: 'alice.smith@visitorone.com', pass: 'Employee@123' },
  { id: 'bob', label: 'Bob', roleName: 'HR Host', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', email: 'bob.jones@visitorone.com', pass: 'Employee@123' },
  { id: 'charlie', label: 'Charlie', roleName: 'Operations', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', email: 'charlie.brown@visitorone.com', pass: 'Employee@123' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState('');
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Access granted. Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch {
      // Error toast handled by api interceptor
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = (profile: DemoProfile) => {
    setActiveProfile(profile.id);
    setEmail(profile.email);
    setPassword(profile.pass);
  };

  const handleForgotPassword = () => {
    toast('For password recovery or clearance reset, please contact your system administrator.', { icon: '🔒', duration: 4000 });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#07090e] px-4 py-12 overflow-hidden selection:bg-indigo-500/20">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-indigo-500/15 via-indigo-600/5 to-transparent blur-3xl rounded-full dark:from-indigo-500/20 dark:via-purple-600/10" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent blur-3xl rounded-full dark:from-indigo-600/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <header className="absolute top-6 right-6 z-20">
        <motion.button
          whileTap={{ scale: 0.9, rotate: 15 }}
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-white/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.1] flex items-center justify-center transition-all duration-150 text-slate-600 dark:text-slate-300 shadow-xs backdrop-blur-md hover:scale-105 active:scale-95"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </motion.div>
        </motion.button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[420px] z-10"
      >
        <div className="relative rounded-3xl bg-white/90 dark:bg-[#0c101b]/90 border border-slate-200/80 dark:border-white/[0.08] shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500" />

          <div className="px-8 pt-8 pb-6 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4 drop-shadow-xl">
              <img src="/favicon.svg" alt="VisitorOne Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Visitor<span className="text-indigo-600 dark:text-indigo-400">One</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Enterprise Visitor Access &amp; Identity Management
            </p>
          </div>

          <div className="px-8 pb-7 space-y-5">
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Work Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"><Mail size={16} /></div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" autoComplete="email" required
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Forgot password?</button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"><Lock size={16} /></div>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" autoComplete="current-password" required
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1" title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="relative w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold tracking-wide transition-all duration-150 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Sign In</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-5 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5">
                  <KeyRound size={12} className="text-indigo-500" /> Quick Demo Access
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">1-click fill</span>
              </div>

              <div className="relative p-1 bg-slate-100/90 dark:bg-white/[0.03] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] grid grid-cols-3 sm:grid-cols-5 gap-1">
                {demoProfiles.map((p) => {
                  const isSelected = activeProfile === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => selectProfile(p)}
                      className={`relative z-10 py-2 px-1.5 rounded-xl font-semibold text-xs transition-colors duration-150 text-center select-none ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      {isSelected && (
                        <motion.div layoutId="loginDemoActivePill" className="absolute inset-0 bg-white dark:bg-[#151c2e] rounded-xl shadow-xs border border-indigo-500/30" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                      )}
                      <span className="relative z-10 block">
                        <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border mb-0.5 ${p.badgeClass}`}>{p.label}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">{p.roleName}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="py-3 px-6 bg-slate-50/80 dark:bg-black/20 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
            </span>
            <span className="font-mono text-[10px] text-slate-400">TLS 1.3 • AES-256</span>
          </div>
        </div>
      </motion.div>

      <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600 font-medium">
        &copy; {new Date().getFullYear()} VisitorOne Security Systems. All rights reserved.
      </footer>
    </div>
  );
}
