import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PatientListView } from './components/PatientListView';
import { AnalyticsView } from './components/AnalyticsView';
import { ModelEvaluationView } from './components/ModelEvaluationView';
import { EarlyWarningCenter } from './components/EarlyWarningCenter';
import { PatientReportView } from './components/PatientReportView';
import { PatientPortalView } from './components/PatientPortalView';
import { PatientDetailModal } from './components/PatientDetailModal';
import { PatientReportModal } from './components/PatientReportModal';
import { AddPatientModal } from './components/AddPatientModal';
import { EditPatientModal } from './components/EditPatientModal';
import { WorkflowPipelineBar } from './components/WorkflowPipelineBar';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { DatasetStatistics, PatientFilterState, PatientRecord, AppView, AiExplanationResult } from './types';
import { getDatasetStats, getPatientById, loadPatientsIntoMemory, resetToBenchmarkCohort } from './services/db';
import { HeartPulse } from 'lucide-react';

function AppContent() {
  const { isDoctor, isPatient, patientId } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);

  const [stats, setStats] = useState<DatasetStatistics>({
    totalPatients: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    avgRiskScore: 0,
    avgAge: 0,
    emergencyPercentage: 0,
    abnormalTestPercentage: 0,
    readmittedCount: 0,
    readmissionRate: 0,
    avgDaysToReadmission: 0,
    hasGenuineTarget: false,
    targetColumnName: null,
    conditionsCount: {},
    admissionTypesCount: {},
    riskDistributionCount: { High: 0, Medium: 0, Low: 0 },
    testResultsCount: {},
    ageGroupsCount: {},
  });

  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [patientModalTab, setPatientModalTab] = useState<'profile' | 'simulator'>('profile');
  const [autoRequestAi, setAutoRequestAi] = useState(false);
  const [reportModalPatient, setReportModalPatient] = useState<PatientRecord | null>(null);
  const [reportModalAiResult, setReportModalAiResult] = useState<AiExplanationResult | null>(null);
  const [patientFilterOverride, setPatientFilterOverride] = useState<Partial<PatientFilterState> | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(true);

  // Automatically switch default view based on user role
  useEffect(() => {
    if (isPatient) {
      setCurrentView('my-health');
    } else if (currentView === 'my-health') {
      setCurrentView('dashboard');
    }
  }, [isPatient]);

  // Load dataset and compute stats
  const refreshStats = useCallback(async () => {
    try {
      const records = await loadPatientsIntoMemory();
      if (records.length === 0) {
        await resetToBenchmarkCohort();
      }
      const newStats = await getDatasetStats();
      setStats(newStats);
    } catch (err) {
      console.error('Error refreshing dataset stats:', err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Navigate to patient list with pre-applied filter
  const handleNavigateToPatientsWithFilter = (filter: Partial<PatientFilterState>) => {
    setPatientFilterOverride({
      ...filter,
      page: 1,
    });
    setCurrentView('patients');
  };

  const handleSelectPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setAutoRequestAi(false);
  };

  const handleExplainPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setAutoRequestAi(true);
  };

  const handleOpenBenchmarkPatientExplanation = async () => {
    const p1 = await getPatientById(patientId || 'PID-00001');
    if (p1) {
      setSelectedPatient(p1);
      setAutoRequestAi(true);
    }
  };

  const handleFocusSearch = () => {
    setCurrentView('dashboard');
    setTimeout(() => {
      const el = document.getElementById('dashboard-patient-search-input');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleOpenEditPatient = (patient: PatientRecord) => {
    setSelectedPatient(null);
    setEditingPatient(patient);
    setIsEditPatientOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-150" id="enroll-live-app">
      {/* 1. Left Sidebar Navigation: Dashboard located directly below EnrollLive Logo */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view !== 'patients') {
            setPatientFilterOverride(undefined);
          }
        }}
        totalPatients={stats.totalPatients}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onOpenAddPatient={() => setIsAddPatientOpen(true)}
      />

      {/* 2. Top Header - Offset on desktop to accommodate left sidebar */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar
          onNavigate={(view) => {
            setCurrentView(view);
            if (view !== 'patients') {
              setPatientFilterOverride(undefined);
            }
          }}
          currentView={currentView}
          totalPatients={stats.totalPatients}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          onOpenAddPatient={() => setIsAddPatientOpen(true)}
        />

        {/* 3. Clinical Workflow Pipeline Stepper */}
        {isDoctor && (
          <WorkflowPipelineBar
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view);
              if (view !== 'patients') {
                setPatientFilterOverride(undefined);
              }
            }}
            onOpenPatientExplanation={handleOpenBenchmarkPatientExplanation}
            onFocusSearch={handleFocusSearch}
          />
        )}

        {/* 4. Main Application Viewport */}
        <main className="flex-1 pb-12 w-full max-w-full overflow-x-hidden">
          {isInitializing ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
              <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Initializing EnrollLive Clinical Engine</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Synchronizing Firestore and local clinical records...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Patient Portal View (Shown for Patients) */}
              {(currentView === 'my-health' || (isPatient && currentView === 'dashboard')) && (
                <PatientPortalView
                  onOpenReportModal={(patient) => {
                    setReportModalPatient(patient);
                    setReportModalAiResult(null);
                  }}
                />
              )}

              {/* Executive Clinical Dashboard (For Doctors / Staff) */}
              {currentView === 'dashboard' && !isPatient && (
                <DashboardView
                  stats={stats}
                  onNavigateToPatientsWithFilter={handleNavigateToPatientsWithFilter}
                  onNavigateToEarlyWarning={() => setCurrentView('early-warning')}
                  onOpenAddPatient={() => setIsAddPatientOpen(true)}
                  onSelectPatient={(patient) => {
                    setPatientModalTab('profile');
                    handleSelectPatient(patient);
                  }}
                  onExplainPatient={(patient) => {
                    setPatientModalTab('profile');
                    handleExplainPatient(patient);
                  }}
                  onOpenReport={(patient) => {
                    setReportModalPatient(patient);
                    setReportModalAiResult(null);
                  }}
                />
              )}

              {/* Early Warning Center (For Doctors / Staff) */}
              {currentView === 'early-warning' && (
                <EarlyWarningCenter
                  onSelectPatient={(patient) => {
                    setPatientModalTab('profile');
                    handleSelectPatient(patient);
                  }}
                  onExplainPatient={(patient) => {
                    setPatientModalTab('profile');
                    handleExplainPatient(patient);
                  }}
                  onOpenWhatIf={(patient) => {
                    setPatientModalTab('simulator');
                    setSelectedPatient(patient);
                    setAutoRequestAi(false);
                  }}
                  onOpenReport={(patient) => {
                    setReportModalPatient(patient);
                    setReportModalAiResult(null);
                  }}
                />
              )}

              {/* Patient Directory & Dataset */}
              {currentView === 'patients' && (
                <PatientListView
                  initialFilter={patientFilterOverride}
                  onSelectPatient={(patient) => {
                    setPatientModalTab('profile');
                    handleSelectPatient(patient);
                  }}
                  onExplainPatient={(patient) => {
                    setPatientModalTab('profile');
                    handleExplainPatient(patient);
                  }}
                />
              )}

              {/* Analytics & Cohorts */}
              {currentView === 'analytics' && (
                <AnalyticsView
                  stats={stats}
                  onNavigateToPatients={handleNavigateToPatientsWithFilter}
                />
              )}

              {/* Model Evaluation & Discriminative Metrics */}
              {currentView === 'evaluation' && (
                <ModelEvaluationView />
              )}

              {/* Clinical Reports Center */}
              {currentView === 'reports' && (
                <PatientReportView
                  initialPatient={selectedPatient}
                  onSelectPatientForDetails={(patient) => {
                    setPatientModalTab('profile');
                    handleSelectPatient(patient);
                  }}
                  onExplainPatient={(patient) => {
                    setPatientModalTab('profile');
                    handleExplainPatient(patient);
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* 5. Persistent Decision Support Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 lg:px-8 mt-auto" id="app-footer">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <HeartPulse className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                <strong>EnrollLive</strong> • Predictive Hospital Readmission Risk Screening &amp; Decision Support
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 max-w-2xl text-center sm:text-left leading-relaxed">
              <strong>Clinical Prototype:</strong> Intended for healthcare decision support and educational demonstration. Does not replace qualified medical diagnosis or clinical judgment.
            </div>
          </div>
        </footer>
      </div>

      {/* Patient Detail & Risk Assessment Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          initialTab={patientModalTab}
          onClose={() => setSelectedPatient(null)}
          autoRequestAi={autoRequestAi}
          onOpenReport={(patient, aiExplanation) => {
            setReportModalPatient(patient);
            setReportModalAiResult(aiExplanation || null);
          }}
          onEditPatient={isDoctor ? handleOpenEditPatient : undefined}
        />
      )}

      {/* One-Click Patient Risk Report Modal */}
      {reportModalPatient && (
        <PatientReportModal
          patient={reportModalPatient}
          onClose={() => setReportModalPatient(null)}
          aiExplanation={reportModalAiResult}
        />
      )}

      {/* Add / Enroll Patient Modal (For Doctors) */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={(newPatient) => {
          refreshStats();
          setSelectedPatient(newPatient);
        }}
      />

      {/* Edit Patient & Clinical Reports Modal (For Doctors) */}
      <EditPatientModal
        isOpen={isEditPatientOpen}
        patient={editingPatient}
        onClose={() => {
          setIsEditPatientOpen(false);
          setEditingPatient(null);
        }}
        onPatientUpdated={(updated) => {
          refreshStats();
          setSelectedPatient(updated);
        }}
      />

      {/* Dual Portal Authentication Modal (Doctors & Patients) */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
