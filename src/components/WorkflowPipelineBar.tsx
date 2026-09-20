import React from 'react';
import { 
  Database, 
  LayoutDashboard, 
  Search, 
  Gauge, 
  Sparkles,
  FileText,
  HeartPulse,
} from 'lucide-react';
import { AppView } from '../types';

interface WorkflowPipelineBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenPatientExplanation: () => void;
  onFocusSearch: () => void;
}

export const WorkflowPipelineBar: React.FC<WorkflowPipelineBarProps> = ({
  currentView,
  onNavigate,
  onOpenPatientExplanation,
  onFocusSearch,
}) => {
  const steps = [
    {
      id: 'patient-db',
      name: 'Clinical Records',
      icon: Database,
      action: () => onNavigate('patients'),
      active: currentView === 'patients',
      tooltip: 'Synchronized patient dataset & multi-factor filters',
      badge: 'Step 1'
    },
    {
      id: 'dashboard',
      name: 'Executive Dashboard',
      icon: LayoutDashboard,
      action: () => onNavigate('dashboard'),
      active: currentView === 'dashboard',
      tooltip: 'KPI statistics, risk distribution & condition breakdown',
      badge: 'Step 2'
    },
    {
      id: 'search-patient',
      name: 'Search Patient',
      icon: Search,
      action: onFocusSearch,
      active: false,
      tooltip: 'Lookup patient by ID, Name, or Condition',
      badge: 'Step 3'
    },
    {
      id: 'risk-score',
      name: 'Cohort Analytics',
      icon: Gauge,
      action: () => onNavigate('analytics'),
      active: currentView === 'analytics',
      tooltip: 'Clinical factor weighting & population risk score tiers',
      badge: 'Step 4'
    },
    {
      id: 'patient-explanation',
      name: 'AI Risk Profile',
      icon: Sparkles,
      action: onOpenPatientExplanation,
      active: false,
      tooltip: 'Patient profile, contributing factors & AI explanation',
      badge: 'Step 5'
    },
    {
      id: 'clinical-reports',
      name: 'Discharge Reports',
      icon: FileText,
      action: () => onNavigate('reports'),
      active: currentView === 'reports',
      tooltip: 'Standardized clinical risk reports & physician notes',
      badge: 'Step 6'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs py-2.5 px-4 sm:px-6 lg:px-8" id="workflow-pipeline-bar">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span>Clinical Decision Pipeline:</span>
        </div>

        {/* Pipeline Steps Sequence */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center overflow-x-auto table-scrollbar py-0.5 max-w-full">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={step.action}
                  title={step.tooltip}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${
                    step.active
                      ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${step.active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-300'}`} />
                  <span>{step.name}</span>
                </button>
                {idx < steps.length - 1 && (
                  <span className="text-slate-300 dark:text-slate-600 select-none text-xs font-mono font-bold">
                    →
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
