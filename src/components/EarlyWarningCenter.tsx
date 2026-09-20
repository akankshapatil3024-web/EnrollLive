import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  ArrowRight, 
  Activity, 
  ShieldAlert, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { PatientRecord, RiskLevel } from '../types';
import { queryPatients } from '../services/db';

interface EarlyWarningCenterProps {
  onSelectPatient: (patient: PatientRecord) => void;
  onExplainPatient: (patient: PatientRecord) => void;
  onOpenWhatIf: (patient: PatientRecord) => void;
  onOpenReport: (patient: PatientRecord) => void;
}

const CONDITIONS = ['All Conditions', 'Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Cancer', 'Obesity'];
const ADMISSION_TYPES = ['All Admissions', 'Emergency', 'Urgent', 'Elective'];

export const EarlyWarningCenter: React.FC<EarlyWarningCenterProps> = ({
  onSelectPatient,
  onExplainPatient,
  onOpenWhatIf,
  onOpenReport,
}) => {
  const [riskFilter, setRiskFilter] = useState<'High' | 'Medium' | 'Low' | 'all'>('High');
  const [conditionFilter, setConditionFilter] = useState<string>('All Conditions');
  const [admissionFilter, setAdmissionFilter] = useState<string>('All Admissions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await queryPatients({
          riskLevel: riskFilter,
          medicalCondition: conditionFilter === 'All Conditions' ? '' : conditionFilter,
          admissionType: admissionFilter === 'All Admissions' ? '' : admissionFilter,
          searchQuery: searchQuery.trim(),
          page,
          pageSize,
          sortBy: 'riskScore',
          sortOrder: 'desc',
        });
        setPatients(result.patients);
        setTotalCount(result.total);
      } catch (err) {
        console.error('Error querying early warning patients:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [riskFilter, conditionFilter, admissionFilter, searchQuery, page, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="early-warning-center-view">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-2xs bg-gradient-to-r from-rose-50/50 via-amber-50/30 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900">
                    🚨 Early Warning Center
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                    Requires Attention / Review
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated triage index identifying patients classified as High risk (risk score ≥ 65%) for coordinated clinical review.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider block">
                Flagged Cohort
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {totalCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Wording notice: Do not describe the alert as a medical emergency */}
        <div className="mt-4 pt-3 border-t border-rose-100 flex items-center gap-2 text-xs text-rose-900 font-medium">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Clinical Review Advisory:</strong> This list flags records that <em>&quot;require attention / review&quot;</em> during discharge planning and outpatient care transition. It is not an acute real-time medical emergency dispatch.
          </span>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="early-warning-search-input"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search by Patient ID (P001), Name, Doctor..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Risk Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">Risk Tier:</span>
            {(['High', 'Medium', 'Low', 'all'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => { setRiskFilter(tier); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  riskFilter === tier
                    ? tier === 'High'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : tier === 'Medium'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : tier === 'Low'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : `${tier} Risk`}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 shrink-0">Medical Condition:</label>
            <select
              value={conditionFilter}
              onChange={(e) => { setConditionFilter(e.target.value); setPage(1); }}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 font-medium"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 shrink-0">Admission Type:</label>
            <select
              value={admissionFilter}
              onChange={(e) => { setAdmissionFilter(e.target.value); setPage(1); }}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 font-medium"
            >
              {ADMISSION_TYPES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Priority Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden" id="early-warning-table-wrapper">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              PRIORITY PATIENTS REQUIRING ATTENTION / REVIEW
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()}
          </span>
        </div>

        <div className="w-full overflow-x-auto table-scrollbar max-w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[850px] xl:min-w-full">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-[140px]">Priority &amp; Alert</th>
                <th className="py-2.5 px-2.5 w-[80px]">Patient ID</th>
                <th className="py-2.5 px-2.5 min-w-[120px]">Patient Name</th>
                <th className="py-2.5 px-2.5 min-w-[100px]">Condition</th>
                <th className="py-2.5 px-2.5 w-[90px]">Admission</th>
                <th className="py-2.5 px-2.5 w-[90px]">Test Result</th>
                <th className="py-2.5 px-2 text-center w-[75px]">Risk Score</th>
                <th className="py-2.5 px-2 w-[100px]">Review Status</th>
                <th className="py-2.5 px-3 text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading early warning patient list...</span>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No patients found matching the selected filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the risk filter or search query.</p>
                  </td>
                </tr>
              ) : (
                patients.map((p, idx) => {
                  const isHigh = p.riskLevel === 'High';
                  const isMedium = p.riskLevel === 'Medium';
                  const priorityRank = (page - 1) * pageSize + idx + 1;

                  return (
                    <tr 
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Priority Alert Indicator */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-md font-mono font-bold flex items-center justify-center text-[10px] ${
                            isHigh 
                              ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                              : isMedium
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            #{priorityRank}
                          </span>
                          {isHigh && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>Requires review</span>
                            </span>
                          )}
                          {isMedium && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>Routine review</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Patient ID */}
                      <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {p.id}
                      </td>

                      {/* Name & Age */}
                      <td className="py-2.5 px-2.5 font-medium text-slate-900">
                        <div className="truncate max-w-[130px] font-bold">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.age} yrs • {p.gender}</div>
                      </td>

                      {/* Condition */}
                      <td className="py-2.5 px-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 truncate max-w-[110px]">
                          {p.medicalCondition}
                        </span>
                      </td>

                      {/* Admission */}
                      <td className="py-2.5 px-2.5 text-slate-700 whitespace-nowrap">
                        <span className={`font-medium ${p.admissionType === 'Emergency' ? 'text-rose-700 font-bold' : ''}`}>
                          {p.admissionType}
                        </span>
                      </td>

                      {/* Test Result */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          p.testResults === 'Abnormal'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : p.testResults === 'Inconclusive'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {p.testResults}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-extrabold font-mono border ${
                          isHigh
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isMedium
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {p.riskScore}%
                        </span>
                      </td>

                      {/* Priority Tag */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className={`text-[11px] font-bold ${
                          isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {isHigh ? 'High Priority' : isMedium ? 'Moderate' : 'Standard'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onExplainPatient(p)}
                            className="p-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors"
                            title="Why This Patient? (AI Explanation)"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenWhatIf(p)}
                            className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                            title="What-If Risk Simulator"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenReport(p)}
                            className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            title="Generate Patient Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectPatient(p)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <span>Profile</span>
                            <ChevronRight className="w-3 h-3" />
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

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 font-semibold"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
