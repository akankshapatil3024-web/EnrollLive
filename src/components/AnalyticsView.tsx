import React from 'react';
import { 
  BarChart3, 
  Activity, 
  Users, 
  Clock, 
  ShieldAlert, 
  ArrowUpRight 
} from 'lucide-react';
import { DatasetStatistics } from '../types';

interface AnalyticsViewProps {
  stats: DatasetStatistics;
  onNavigateToPatients: (filter: any) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  onNavigateToPatients,
}) => {
  const total = stats.totalPatients || 1;

  // Conditions
  const conditions = Object.entries(stats.conditionsCount).sort((a, b) => b[1] - a[1]);
  // Admission types
  const admissions = Object.entries(stats.admissionTypesCount).sort((a, b) => b[1] - a[1]);
  // Test results
  const testResults = Object.entries(stats.testResultsCount).sort((a, b) => b[1] - a[1]);
  // Age groups
  const ageGroups = Object.entries(stats.ageGroupsCount);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="analytics-view-container">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>Population Health Analytics &amp; Risk Distribution</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated statistical distributions across {stats.totalPatients.toLocaleString()} chronic disease patient encounters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
            Cohort Size: {stats.totalPatients.toLocaleString()} records
          </span>
        </div>
      </div>

      {/* Grid: Risk & Age Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Readmission Risk Tier Breakdown</h2>
              <p className="text-xs text-slate-500">Distribution across High, Medium, and Low risk thresholds</p>
            </div>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>

          <div className="mt-6 space-y-5">
            {/* High */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  High Risk (Score ≥ 65%)
                </span>
                <span className="font-mono text-slate-700">
                  {stats.highRiskCount.toLocaleString()} ({Math.round((stats.highRiskCount / total) * 100)}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${(stats.highRiskCount / total) * 100}%` }}
                  className="h-full bg-rose-500 rounded-full"
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Medium Risk (Score 35% - 64%)
                </span>
                <span className="font-mono text-slate-700">
                  {stats.mediumRiskCount.toLocaleString()} ({Math.round((stats.mediumRiskCount / total) * 100)}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${(stats.mediumRiskCount / total) * 100}%` }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
            </div>

            {/* Low */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Low Risk (Score &lt; 35%)
                </span>
                <span className="font-mono text-slate-700">
                  {stats.lowRiskCount.toLocaleString()} ({Math.round((stats.lowRiskCount / total) * 100)}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${(stats.lowRiskCount / total) * 100}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Population Mean Risk:</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{stats.avgRiskScore}%</span>
          </div>
        </div>

        {/* Age Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Age Cohort Demographics</h2>
              <p className="text-xs text-slate-500">Distribution of patients across age brackets</p>
            </div>
            <Users className="w-4 h-4 text-sky-600" />
          </div>

          <div className="mt-6 space-y-4">
            {ageGroups.map(([group, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={group}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{group} years</span>
                    <span className="font-mono text-slate-500">
                      {count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${pct}%` }}
                      className="h-full bg-sky-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Average Patient Age:</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{stats.avgAge} years</span>
          </div>
        </div>
      </div>

      {/* Grid: Conditions & Admission & Labs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Medical Conditions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            Chronic Medical Conditions
          </h2>
          <div className="mt-4 space-y-3">
            {conditions.map(([condition, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div 
                  key={condition} 
                  onClick={() => onNavigateToPatients({ medicalCondition: condition })}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-sky-200 hover:bg-sky-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span className="group-hover:text-sky-700 transition-colors">{condition}</span>
                    <span className="font-mono text-slate-500">{count.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${pct}%` }}
                      className="h-full bg-sky-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admission Type */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            Admission Acuity Types
          </h2>
          <div className="mt-4 space-y-4">
            {admissions.map(([type, count]) => {
              const pct = Math.round((count / total) * 100);
              const color = type.toLowerCase().includes('emergency')
                ? 'text-rose-600 bg-rose-50 border-rose-200'
                : type.toLowerCase().includes('urgent')
                ? 'text-amber-600 bg-amber-50 border-amber-200'
                : 'text-slate-700 bg-slate-50 border-slate-200';

              return (
                <div 
                  key={type}
                  onClick={() => onNavigateToPatients({ admissionType: type })}
                  className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${color}`}>
                      {type}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 flex justify-between">
                    <span>Proportion of admissions:</span>
                    <strong className="text-slate-700">{pct}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Result Findings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            Discharge Diagnostic Findings
          </h2>
          <div className="mt-4 space-y-4">
            {testResults.map(([result, count]) => {
              const pct = Math.round((count / total) * 100);
              const badge = result.toLowerCase() === 'abnormal'
                ? 'bg-rose-500'
                : result.toLowerCase() === 'inconclusive'
                ? 'bg-amber-400'
                : 'bg-emerald-500';

              return (
                <div 
                  key={result}
                  onClick={() => onNavigateToPatients({ testResults: result })}
                  className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${badge}`} />
                      <span className="text-xs font-bold text-slate-800">{result}</span>
                    </div>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 flex justify-between">
                    <span>Cohort frequency:</span>
                    <strong className="text-slate-700">{pct}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
