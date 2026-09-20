import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  TrendingUp, 
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  RotateCcw,
  UserPlus,
  Database,
  Repeat,
  CalendarClock,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { DatasetStatistics, PatientRecord } from '../types';
import { queryPatients } from '../services/db';

interface DashboardViewProps {
  stats: DatasetStatistics;
  onNavigateToPatientsWithFilter: (filter: {
    riskLevel?: 'all' | 'Low' | 'Medium' | 'High';
    medicalCondition?: string;
    admissionType?: string;
    readmissionStatus?: 'all' | 'readmitted' | 'not-readmitted';
  }) => void;
  onNavigateToEarlyWarning?: () => void;
  onOpenAddPatient?: () => void;
  onSelectPatient: (patient: PatientRecord) => void;
  onExplainPatient: (patient: PatientRecord) => void;
  onOpenReport?: (patient: PatientRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onNavigateToPatientsWithFilter,
  onNavigateToEarlyWarning,
  onOpenAddPatient,
  onSelectPatient,
  onExplainPatient,
  onOpenReport,
}) => {
  // Search & Table State for inline dashboard patient lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [readmissionFilter, setReadmissionFilter] = useState<'all' | 'readmitted' | 'not-readmitted'>('all');
  const [earlyDaysOnly, setEarlyDaysOnly] = useState(false); // <= 7 days post-discharge
  const [sortBy, setSortBy] = useState<'id' | 'riskScore' | 'age' | 'name' | 'readmissionDays'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const highRiskPct = stats.totalPatients > 0 
    ? Math.round((stats.highRiskCount / stats.totalPatients) * 100) 
    : 0;
  const mediumRiskPct = stats.totalPatients > 0 
    ? Math.round((stats.mediumRiskCount / stats.totalPatients) * 100) 
    : 0;
  const lowRiskPct = stats.totalPatients > 0 
    ? Math.round((stats.lowRiskCount / stats.totalPatients) * 100) 
    : 0;

  // Conditions list
  const conditionList = Object.keys(stats.conditionsCount).sort();

  // Load patients when search or filter parameters change
  useEffect(() => {
    let isCancelled = false;

    async function fetchPatients() {
      setLoading(true);
      try {
        const result = await queryPatients({
          searchQuery,
          riskLevel: selectedRisk,
          medicalCondition: selectedCondition,
          readmissionStatus: readmissionFilter,
          admissionType: 'all',
          testResults: 'all',
          ageRange: 'all',
          page,
          pageSize,
          sortBy,
          sortOrder,
        });

        if (!isCancelled) {
          let list = result.patients;
          if (earlyDaysOnly) {
            list = list.filter(p => p.readmissionDays !== undefined && p.readmissionDays <= 7);
          }
          setPatients(list);
          setTotalCount(earlyDaysOnly ? list.length : result.total);
          setTotalPages(earlyDaysOnly ? Math.max(1, Math.ceil(list.length / pageSize)) : result.totalPages);
        }
      } catch (err) {
        console.error('Failed to query dashboard patients:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchPatients();

    return () => {
      isCancelled = true;
    };
  }, [
    searchQuery, 
    selectedRisk, 
    selectedCondition, 
    readmissionFilter, 
    earlyDaysOnly,
    sortBy, 
    sortOrder, 
    page, 
    pageSize, 
    stats.totalPatients,
    stats.readmittedCount
  ]);

  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedRisk('all');
    setSelectedCondition('all');
    setReadmissionFilter('all');
    setEarlyDaysOnly(false);
    setSortBy('id');
    setSortOrder('asc');
    setPage(1);
  };

  const switchToReadmissionsTab = () => {
    setReadmissionFilter('readmitted');
    setSortBy('readmissionDays');
    setSortOrder('asc');
    setPage(1);
  };

  const switchToAllPatientsTab = () => {
    setReadmissionFilter('all');
    setEarlyDaysOnly(false);
    setSortBy('id');
    setSortOrder('asc');
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="dashboard-view-container">
      {/* 🏥 Header: EnrollLive - AI-Powered Hospital Readmission Risk Screening */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4" id="dashboard-header-card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
            🏥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                EnrollLive
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Clinical Prototype
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              AI-Powered Hospital Readmission Risk Screening
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Screening chronic disease patients for 30-day post-discharge readmission vulnerability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {onOpenAddPatient && (
            <button
              onClick={onOpenAddPatient}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-xs"
              id="dashboard-add-patient-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Enroll Patient</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Cloud Firestore Synced</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Metric Row: Total Patients | High Risk | Medium Risk | Low Risk | 30-Day Readmissions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5" id="dashboard-metric-cards">
        {/* 1. Total Patients */}
        <div 
          onClick={switchToAllPatientsTab}
          className={`bg-white dark:bg-slate-900 rounded-xl border p-4.5 shadow-2xs hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group ${
            readmissionFilter === 'all' && selectedRisk === 'all' ? 'border-sky-500 ring-2 ring-sky-200 dark:ring-sky-900' : 'border-slate-200 dark:border-slate-800'
          }`}
          id="stat-card-total-patients"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              TOTAL PATIENTS
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.totalPatients.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Enrolled</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
            <span>Avg: <strong>{stats.avgAge} yrs</strong></span>
            <span>•</span>
            <span>Score: <strong>{stats.avgRiskScore}/100</strong></span>
          </div>
        </div>

        {/* 2. High Screening Risk */}
        <div 
          onClick={() => { setSelectedRisk('High'); setReadmissionFilter('all'); setPage(1); }}
          className={`bg-white dark:bg-slate-900 rounded-xl border p-4.5 shadow-2xs hover:border-rose-400 transition-all cursor-pointer group ${
            selectedRisk === 'High' ? 'border-rose-500 ring-2 ring-rose-200 dark:ring-rose-950' : 'border-rose-200 dark:border-rose-900/50'
          }`}
          id="stat-card-high-risk"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              HIGH RISK
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {stats.highRiskCount.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              {highRiskPct}%
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1 font-medium">
            <span>Score ≥ 65 • Urgent</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 3. Medium Screening Risk */}
        <div 
          onClick={() => { setSelectedRisk('Medium'); setReadmissionFilter('all'); setPage(1); }}
          className={`bg-white dark:bg-slate-900 rounded-xl border p-4.5 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group ${
            selectedRisk === 'Medium' ? 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-950' : 'border-amber-200 dark:border-amber-900/50'
          }`}
          id="stat-card-medium-risk"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              MEDIUM RISK
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.mediumRiskCount.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              {mediumRiskPct}%
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
            <span>Score 35–64</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 4. Low Screening Risk */}
        <div 
          onClick={() => { setSelectedRisk('Low'); setReadmissionFilter('all'); setPage(1); }}
          className={`bg-white dark:bg-slate-900 rounded-xl border p-4.5 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer group ${
            selectedRisk === 'Low' ? 'border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950' : 'border-emerald-200 dark:border-emerald-900/50'
          }`}
          id="stat-card-low-risk"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              LOW RISK
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.lowRiskCount.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {lowRiskPct}%
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <span>Score &lt; 35 • Stable</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 5. 🚨 30-Day Readmissions (User Requested Readmission Feature) */}
        <div 
          onClick={switchToReadmissionsTab}
          className={`bg-white dark:bg-slate-900 rounded-xl border p-4.5 shadow-2xs hover:border-purple-400 dark:hover:border-purple-600 transition-all cursor-pointer group ${
            readmissionFilter === 'readmitted' ? 'border-purple-600 ring-2 ring-purple-300 dark:ring-purple-950 bg-purple-50/20 dark:bg-purple-950/20' : 'border-purple-200 dark:border-purple-900/50'
          }`}
          id="stat-card-readmissions"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
              <span>READMISSIONS</span>
              <span className="px-1 py-0.2 rounded text-[9px] bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">30-Day</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Repeat className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-300 font-mono">
              {stats.readmittedCount.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              {stats.readmissionRate}% Rate
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-purple-700 dark:text-purple-300 flex items-center justify-between font-medium">
            <span>Avg {stats.avgDaysToReadmission}d to return</span>
            <span className="text-[10px] underline font-bold group-hover:text-purple-900">View Data →</span>
          </div>
        </div>
      </div>

      {/* 📊 Dedicated Readmission Intelligence Banner (Active when Readmission Filter is active or viewed) */}
      {readmissionFilter === 'readmitted' && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/80 p-5 shadow-xs animate-in fade-in duration-200" id="readmission-cohort-banner">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Repeat className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-purple-950 dark:text-purple-100">
                    30-Day Readmitted Patients Registry &amp; Clinical Recurrence Data
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/80 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                    Verified Cohort
                  </span>
                </div>
                <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5">
                  Detailed encounter records for patients readmitted within the 30-day post-discharge window, including return dates, clinical triggers, and acuity.
                </p>
              </div>
            </div>

            {/* Readmission Quick KPI Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-800 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 block text-[10px] font-semibold">COHORT VOLUME</span>
                <strong className="font-mono text-purple-700 dark:text-purple-300">{stats.readmittedCount.toLocaleString()}</strong> Readmitted Patients
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-800 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 block text-[10px] font-semibold">AVERAGE RETURN</span>
                <strong className="font-mono text-purple-700 dark:text-purple-300">{stats.avgDaysToReadmission}</strong> Days Post-Discharge
              </div>

              <button
                type="button"
                onClick={() => setEarlyDaysOnly(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                  earlyDaysOnly 
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100/50'
                }`}
                title="Filter for immediate readmissions within 7 days"
              >
                {earlyDaysOnly ? 'Showing ≤ 7 Days' : '⚡ Filter ≤ 7 Days'}
              </button>

              <button
                type="button"
                onClick={switchToAllPatientsTab}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-purple-100/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold transition-colors"
              >
                Show All Patients
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Search Patient Section & Direct Patient Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs" id="dashboard-patients-section">
        
        {/* Cohort Switcher Tabs (All Enrolled vs Readmitted Cohort) */}
        <div className="px-5 pt-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={switchToAllPatientsTab}
              id="tab-all-patients"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                readmissionFilter === 'all'
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>All Monitored Patients</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats.totalPatients.toLocaleString()}
              </span>
            </button>

            <button
              type="button"
              onClick={switchToReadmissionsTab}
              id="tab-readmitted-patients"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                readmissionFilter === 'readmitted'
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Repeat className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 stroke-[2.5]" />
              <span>30-Day Readmitted Patients</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                {stats.readmittedCount.toLocaleString()}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 pb-2">
            Viewing: <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalCount.toLocaleString()}</strong> records
          </div>
        </div>

        {/* Search Bar & Filters Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{readmissionFilter === 'readmitted' ? 'Readmitted Patients Dataset' : 'Patient Search & Risk Screening'}</span>
                <span>{readmissionFilter === 'readmitted' ? '🚨' : '🔍'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {readmissionFilter === 'readmitted' 
                  ? 'Search and inspect readmitted patients by ID, name, chronic condition, or readmission cause'
                  : 'Search by Patient ID (e.g. PID-00001, P001), patient name, or medical condition'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(searchQuery || selectedRisk !== 'all' || selectedCondition !== 'all' || readmissionFilter !== 'all' || earlyDaysOnly) && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Input Box & Controls */}
          <div className="flex flex-col sm:flex-row gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="dashboard-patient-search-input"
                type="text"
                placeholder={
                  readmissionFilter === 'readmitted'
                    ? 'Search readmitted patients: [ ID, Name, Condition, Reason... ] 🔍'
                    : 'Search Patient: [ Enter Patient ID, Name, or Condition... ] 🔍'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 dark:text-slate-100 shadow-2xs"
              />
            </div>

            {/* Readmission Status Filter Dropdown */}
            <select
              id="dashboard-readmission-filter"
              value={readmissionFilter}
              onChange={(e) => {
                setReadmissionFilter(e.target.value as any);
                setPage(1);
              }}
              className="text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses (Cohort &amp; Returns)</option>
              <option value="readmitted">🚨 Readmitted Patients Only</option>
              <option value="not-readmitted">✅ Not Readmitted (Discharged)</option>
            </select>

            {/* Condition Filter */}
            <select
              id="dashboard-condition-filter"
              value={selectedCondition}
              onChange={(e) => {
                setSelectedCondition(e.target.value);
                setPage(1);
              }}
              className="text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Conditions</option>
              {conditionList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Risk Filter */}
            <select
              id="dashboard-risk-filter"
              value={selectedRisk}
              onChange={(e) => {
                setSelectedRisk(e.target.value as any);
                setPage(1);
              }}
              className="text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="High">High Risk (Score ≥ 65)</option>
              <option value="Medium">Medium Risk (35-64)</option>
              <option value="Low">Low Risk (&lt; 35)</option>
            </select>

            {/* Sort Filter */}
            <select
              id="dashboard-sort-filter"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
                setPage(1);
              }}
              className="text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {readmissionFilter === 'readmitted' ? (
                <>
                  <option value="readmissionDays-asc">Sort: Fastest Return (Days)</option>
                  <option value="readmissionDays-desc">Sort: Latest Return (Days)</option>
                  <option value="riskScore-desc">Sort: Highest Initial Risk</option>
                  <option value="id-asc">Sort: ID (Ascending)</option>
                  <option value="name-asc">Sort: Name (A-Z)</option>
                </>
              ) : (
                <>
                  <option value="id-asc">Sort: ID (P001, P002...)</option>
                  <option value="riskScore-desc">Sort: Highest Risk First</option>
                  <option value="riskScore-asc">Sort: Lowest Risk First</option>
                  <option value="age-desc">Sort: Oldest First</option>
                  <option value="name-asc">Sort: Name (A-Z)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Live Patient Table (Tailored for Monitored or Readmitted View) */}
        <div className="w-full overflow-x-auto table-scrollbar max-w-full">
          <table className="w-full text-left text-xs min-w-[720px] lg:min-w-full" id="dashboard-patients-table">
            <thead className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Condition &amp; Vitals</th>
                {readmissionFilter === 'readmitted' ? (
                  <>
                    <th className="py-2.5 px-3">Discharge Date</th>
                    <th className="py-2.5 px-3">Readmission Timing</th>
                    <th className="py-2.5 px-3">Clinical Cause &amp; Acuity</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-3">Age / Sex</th>
                    <th className="py-2.5 px-3">Admission Stay</th>
                    <th className="py-2.5 px-3">30-Day Status</th>
                  </>
                )}
                <th className="py-2.5 px-3 text-center">Screening Risk</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={readmissionFilter === 'readmitted' ? 7 : 6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>Retrieving patient records...</span>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={readmissionFilter === 'readmitted' ? 7 : 6} className="py-12 text-center text-slate-400">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching patient records found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or reset the readmission filters.</p>
                    <button
                      type="button"
                      onClick={handleResetSearch}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold text-xs hover:bg-sky-100 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const isHigh = patient.riskLevel === 'High';
                  const isMedium = patient.riskLevel === 'Medium';
                  const isReadmitted = patient.readmissionTarget === 1;

                  const riskBadgeClass = isHigh
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    : isMedium
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectPatient(patient)}
                    >
                      {/* Patient ID and Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs text-sky-900 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800 shadow-2xs">
                            {patient.id}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                            {patient.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {patient.gender} • Blood: {patient.bloodType} • Room {patient.roomNumber}
                        </div>
                      </td>

                      {/* Condition & Treatment */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {patient.medicalCondition}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate max-w-[150px]">
                          Rx: {patient.medication}
                        </span>
                      </td>

                      {/* Dynamic Columns based on Readmission View */}
                      {readmissionFilter === 'readmitted' ? (
                        <>
                          {/* Prior Discharge Date */}
                          <td className="py-3 px-3">
                            <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                              {patient.dischargeDate || 'N/A'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Stay: {patient.lengthOfStayDays}d
                            </span>
                          </td>

                          {/* Readmission Date & Timing */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/70 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                {patient.readmissionDate || 'Returned'}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold block mt-0.5 ${
                              (patient.readmissionDays || 0) <= 7 ? 'text-rose-600 dark:text-rose-400' : 'text-purple-700 dark:text-purple-300'
                            }`}>
                              Day {patient.readmissionDays || '14'} post-discharge
                              {(patient.readmissionDays || 0) <= 7 && ' ⚡ Early'}
                            </span>
                          </td>

                          {/* Readmission Acuity & Cause */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                patient.readmissionAcuity === 'Emergency'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {patient.readmissionAcuity || 'Emergency'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate max-w-[220px]" title={patient.readmissionReason}>
                              {patient.readmissionReason || 'Acute post-discharge decompensation'}
                            </p>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Age & Sex */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{patient.age} yrs</span>
                            <span className="text-[11px] text-slate-400 block">{patient.testResults} test</span>
                          </td>

                          {/* Admission Stay */}
                          <td className="py-3 px-3">
                            <span className="text-slate-700 dark:text-slate-300 text-xs block">{patient.admissionType}</span>
                            <span className="text-[11px] text-slate-400 block">{patient.lengthOfStayDays} days stay</span>
                          </td>

                          {/* 30-Day Readmission Status Badge */}
                          <td className="py-3 px-3">
                            {isReadmitted ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <Repeat className="w-3 h-3 stroke-[2.5]" />
                                <span>Readmitted (Day {patient.readmissionDays || 14})</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Not Readmitted</span>
                              </div>
                            )}
                          </td>
                        </>
                      )}

                      {/* Risk Screening Score */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black tracking-wide border ${riskBadgeClass}`}>
                          {patient.riskLevel.toUpperCase()} ({patient.riskScore} / 100)
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectPatient(patient)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors"
                            title="View Clinical Details & Risk Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {onOpenReport && (
                            <button
                              type="button"
                              onClick={() => onOpenReport(patient)}
                              className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors"
                              title="Generate One-Click Risk Report"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onExplainPatient(patient)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-semibold border border-sky-200 dark:border-sky-800 transition-colors"
                            title="Why This Patient? (AI Risk Explanation)"
                          >
                            <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                            <span className="hidden sm:inline">Explain</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing <strong>{patients.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> -{' '}
            <strong>{Math.min(page * pageSize, totalCount)}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{totalCount.toLocaleString()}</strong> patients
            {readmissionFilter === 'readmitted' && ' in Readmitted Registry'}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="py-1 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 text-xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
