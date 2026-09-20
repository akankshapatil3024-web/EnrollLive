import React from 'react';
import {
  Activity,
  Users,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  FileText,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  User,
  Database,
  LogIn,
  LogOut,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';
import { AppView } from '../types';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  totalPatients: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenAddPatient?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  totalPatients,
  isMobileOpen,
  setIsMobileOpen,
  onOpenAddPatient,
}) => {
  const { currentUser, isDoctor, isPatient, setIsAuthModalOpen, logout, databaseConnected } = useAuth();

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Left Sidebar Container */}
      <aside
        id="app-left-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* 1. EnrollLive Logo & Brand at top */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleNavClick(isPatient ? 'my-health' : 'dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
              id="sidebar-brand-btn"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-600 dark:bg-sky-500 flex items-center justify-center text-white shadow-xs group-hover:bg-sky-700 transition-colors shrink-0">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                    EnrollLive
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    Clinical AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                  Hospital Readmission Screening
                </p>
              </div>
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Portal indicator pill */}
          <div className="mt-3 flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-1.5">
              {isPatient ? (
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Stethoscope className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              )}
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {isPatient ? 'Patient Portal' : 'Doctor / Staff Portal'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="text-[10px] font-bold text-sky-600 hover:text-sky-800 dark:text-sky-400 underline"
            >
              Switch
            </button>
          </div>
        </div>

        {/* 2. Navigation items Just Below the EnrollLive Logo */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Clinical Navigation
          </div>

          {/* DASHBOARD - Located on the left side just below the EnrollLive logo! */}
          <button
            type="button"
            id="sidebar-nav-dashboard"
            onClick={() => handleNavClick(isPatient ? 'my-health' : 'dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              (currentView === 'dashboard' || (isPatient && currentView === 'my-health'))
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{isPatient ? 'My Health Dashboard' : 'Dashboard'}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* DOCTOR / CLINICIAN SPECIFIC NAVIGATION */}
          {isDoctor && (
            <>
              <button
                type="button"
                id="sidebar-nav-patients"
                onClick={() => handleNavClick('patients')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  currentView === 'patients'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Patient Directory</span>
                </div>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {totalPatients > 0 ? `${(totalPatients / 1000).toFixed(0)}k+` : '0'}
                </span>
              </button>

              <button
                type="button"
                id="sidebar-nav-early-warning"
                onClick={() => handleNavClick('early-warning')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  currentView === 'early-warning'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Early Warning Center</span>
                </div>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 animate-pulse">
                  High Risk
                </span>
              </button>

              <button
                type="button"
                id="sidebar-nav-analytics"
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  currentView === 'analytics'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Analytics &amp; Cohorts</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                type="button"
                id="sidebar-nav-evaluation"
                onClick={() => handleNavClick('evaluation')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  currentView === 'evaluation'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BrainCircuit className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Model Evaluation</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                type="button"
                id="sidebar-nav-reports"
                onClick={() => handleNavClick('reports')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  currentView === 'reports'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Clinical Reports</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Quick Action: Add Patient */}
              {onOpenAddPatient && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenAddPatient}
                    className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Enroll Patient</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* PATIENT-SPECIFIC NAVIGATION (Restricted to their own data only!) */}
          {isPatient && (
            <>
              <div className="p-3 my-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-emerald-800 dark:text-emerald-300">
                <span className="font-bold block">Patient Access Active</span>
                Showing only your personal medical charts and post-discharge plan.
              </div>

              <button
                type="button"
                onClick={() => handleNavClick('my-health')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  currentView === 'my-health'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>My Clinical Discharge Report</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </>
          )}
        </div>

        {/* 3. Bottom Controls: Theme Toggle, Database Status & Session Profile */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Cloud Firestore Indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  databaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <Database className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="font-medium">Cloud Firestore</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              Connected
            </span>
          </div>

          {/* Theme Toggle Button */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Appearance</span>
            <ThemeToggle showLabel={true} />
          </div>

          {/* User Account / Profile Card */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser ? currentUser.displayName.charAt(0) : 'D'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser ? currentUser.displayName : 'Dr. Sarah Rao, MD'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser ? currentUser.role : 'Attending Physician'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="sidebar-signout-btn"
                onClick={() => {
                  if (currentUser) {
                    logout();
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                title={currentUser ? 'Sign out' : 'Sign in'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                {currentUser ? <LogOut className="w-3.5 h-3.5 text-rose-500" /> : <LogIn className="w-3.5 h-3.5 text-sky-600" />}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
