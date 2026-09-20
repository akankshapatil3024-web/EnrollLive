import React from 'react';
import { 
  Activity, 
  Menu,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  Database,
  PlusCircle,
  LogIn,
  User,
} from 'lucide-react';
import { AppView } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  totalPatients: number;
  onToggleMobileSidebar: () => void;
  onOpenAddPatient?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  totalPatients,
  onToggleMobileSidebar,
  onOpenAddPatient,
}) => {
  const { currentUser, isDoctor, isPatient, setIsAuthModalOpen, databaseConnected } = useAuth();

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Executive Clinical Dashboard';
      case 'patients':
        return 'Patient Directory & Screening Dataset';
      case 'early-warning':
        return 'Early Warning Center — High Readmission Vulnerability';
      case 'analytics':
        return 'Cohort Analytics & Risk Stratification';
      case 'evaluation':
        return 'Model Evaluation & Discriminative Metrics';
      case 'reports':
        return 'Clinical Discharge & Vulnerability Reports';
      case 'my-health':
        return 'Personal Patient Health Record & Care Plan';
      default:
        return 'Clinical Decision Support';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 shadow-2xs" id="app-top-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Sidebar Hamburger & Current View Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
                  EnrollLive
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {getViewTitle()}
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Role indicator, Add Patient, Auth profile & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Add Patient Button for Doctors */}
            {isDoctor && onOpenAddPatient && (
              <button
                type="button"
                id="navbar-add-patient-btn"
                onClick={onOpenAddPatient}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Enroll Patient</span>
              </button>
            )}

            {/* Cloud Firestore Status Badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap"
              title={databaseConnected ? "Cloud Firestore synchronized" : "Connecting to database..."}
            >
              <span className={`w-2 h-2 rounded-full ${databaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <Database className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span className="text-[11px] font-semibold">
                {isDoctor ? `${totalPatients.toLocaleString()} records` : 'Protected PHI'}
              </span>
            </div>

            {/* Auth Profile / Sign In Pill */}
            <button
              id="header-auth-btn"
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              {currentUser ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[110px] truncate text-slate-900 dark:text-white font-bold">
                    {currentUser.displayName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 uppercase">
                    {currentUser.accountType}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Sign In / Sign Up</span>
                </>
              )}
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle showLabel={false} />
          </div>
        </div>
      </div>
    </header>
  );
};
