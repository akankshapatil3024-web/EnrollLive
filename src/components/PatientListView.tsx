import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  ArrowUpDown,
  Eye,
  Activity,
  Download,
  UserPlus,
  Edit3,
} from 'lucide-react';
import { PatientFilterState, PatientRecord } from '../types';
import { queryPatients } from '../services/db';
import { AddPatientModal } from './AddPatientModal';
import { EditPatientModal } from './EditPatientModal';
import { useAuth } from '../context/AuthContext';

interface PatientListViewProps {
  initialFilter?: Partial<PatientFilterState>;
  onSelectPatient: (patient: PatientRecord) => void;
  onExplainPatient: (patient: PatientRecord) => void;
}

export const PatientListView: React.FC<PatientListViewProps> = ({
  initialFilter,
  onSelectPatient,
  onExplainPatient,
}) => {
  const { isDoctor, isPatient, patientId } = useAuth();
  const [filters, setFilters] = useState<PatientFilterState>({
    searchQuery: '',
    ageRange: 'all',
    medicalCondition: 'all',
    admissionType: 'all',
    riskLevel: 'all',
    testResults: 'all',
    sortBy: 'riskScore',
    sortOrder: 'desc',
    page: 1,
    pageSize: 25,
    ...initialFilter,
  });

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sync initialFilter prop if changed
  useEffect(() => {
    if (initialFilter) {
      setFilters(prev => ({
        ...prev,
        ...initialFilter,
        page: 1,
      }));
    }
  }, [initialFilter]);

  // Query database on filter changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const queryParams = isPatient
          ? { ...filters, searchQuery: patientId || 'PID-00001', pageSize: 1 }
          : filters;
        const result = await queryPatients(queryParams);
        if (!isCancelled) {
          setPatients(result.patients);
          setTotalCount(result.total);
          setTotalPages(result.totalPages);
        }
      } catch (err) {
        console.error('Error querying patients:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [filters, isPatient, patientId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: e.target.value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      ageRange: 'all',
      medicalCondition: 'all',
      admissionType: 'all',
      riskLevel: 'all',
      testResults: 'all',
      sortBy: 'riskScore',
      sortOrder: 'desc',
      page: 1,
      pageSize: 25,
    });
  };

  const handleExportCsv = () => {
    if (patients.length === 0) return;
    const headers = ['ID', 'Name', 'Age', 'Gender', 'Medical Condition', 'Admission Type', 'Test Results', 'Risk Score', 'Risk Level', 'Doctor', 'Hospital'];
    const rows = patients.map(p => [
      p.id,
      `"${p.name}"`,
      p.age,
      p.gender,
      `"${p.medicalCondition}"`,
      p.admissionType,
      p.testResults,
      p.riskScore,
      p.riskLevel,
      `"${p.doctor}"`,
      `"${p.hospital}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `enrolllive_patient_cohort_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="patients-view-container">
      {/* Header and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600" />
              <span>Patient Directory &amp; Risk Screening</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Search, filter, and review readmission risk profiles across clinical cohorts
            </p>
          </div>

          {/* Quick Actions: Search and Export */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="patient-search-input"
                value={filters.searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by Patient Name, ID (PID-), Doctor..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              title="Export current filtered cohort to CSV"
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddPatientOpen(true)}
              title="Enroll new patient into Cloud Firestore and screening model"
              className="px-3 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enroll Patient</span>
              <span className="sm:hidden">Enroll</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Medical Condition Filter */}
          <div>
            <label htmlFor="filter-medical-condition" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Medical Condition
            </label>
            <select
              id="filter-medical-condition"
              value={filters.medicalCondition}
              onChange={(e) => setFilters(prev => ({ ...prev, medicalCondition: e.target.value, page: 1 }))}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 text-slate-800"
            >
              <option value="all">All Conditions</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Hypertension">Hypertension</option>
              <option value="Asthma">Asthma</option>
              <option value="Arthritis">Arthritis</option>
              <option value="Cancer">Cancer</option>
              <option value="Obesity">Obesity</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label htmlFor="filter-risk-level" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Risk Level
            </label>
            <select
              id="filter-risk-level"
              value={filters.riskLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value as any, page: 1 }))}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 text-slate-800"
            >
              <option value="all">All Risk Levels</option>
              <option value="High">High Risk (≥65%)</option>
              <option value="Medium">Medium Risk (35-64%)</option>
              <option value="Low">Low Risk (&lt;35%)</option>
            </select>
          </div>

          {/* Admission Type Filter */}
          <div>
            <label htmlFor="filter-admission-type" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Admission Type
            </label>
            <select
              id="filter-admission-type"
              value={filters.admissionType}
              onChange={(e) => setFilters(prev => ({ ...prev, admissionType: e.target.value, page: 1 }))}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 text-slate-800"
            >
              <option value="all">All Admissions</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent">Urgent</option>
              <option value="Elective">Elective</option>
            </select>
          </div>

          {/* Age Cohort Filter */}
          <div>
            <label htmlFor="filter-age-range" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Age Cohort
            </label>
            <select
              id="filter-age-range"
              value={filters.ageRange}
              onChange={(e) => setFilters(prev => ({ ...prev, ageRange: e.target.value as any, page: 1 }))}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 text-slate-800"
            >
              <option value="all">All Ages</option>
              <option value="under-30">&lt; 30 years</option>
              <option value="30-49">30 - 49 years</option>
              <option value="50-64">50 - 64 years</option>
              <option value="65-plus">65+ years</option>
            </select>
          </div>

          {/* Readmission Status Filter */}
          <div>
            <label htmlFor="filter-readmission-status" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Readmission Status
            </label>
            <select
              id="filter-readmission-status"
              value={filters.readmissionStatus || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, readmissionStatus: e.target.value as any, page: 1 }))}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 text-slate-800"
            >
              <option value="all">All Patients</option>
              <option value="readmitted">🚨 Readmitted Patients</option>
              <option value="not-readmitted">✅ Not Readmitted</option>
            </select>
          </div>

          {/* Test Results Filter */}
          <div>
            <label htmlFor="filter-test-results" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Test Results
            </label>
            <select
              id="filter-test-results"
              value={filters.testResults}
              onChange={(e) => setFilters(prev => ({ ...prev, testResults: e.target.value, page: 1 }))}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 text-slate-800"
            >
              <option value="all">All Test Findings</option>
              <option value="Abnormal">Abnormal</option>
              <option value="Normal">Normal</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>
          </div>

          {/* Sort By / Reset */}
          <div className="flex items-end gap-1.5">
            <div className="flex-1">
              <label htmlFor="filter-sort-by" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Sort Order
              </label>
              <select
                id="filter-sort-by"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [any, any];
                  setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
                }}
                className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 text-slate-800"
              >
                <option value="riskScore-desc">Highest Risk First</option>
                <option value="riskScore-asc">Lowest Risk First</option>
                <option value="readmissionDays-asc">Fastest Readmission (Days)</option>
                <option value="age-desc">Age: Oldest First</option>
                <option value="age-asc">Age: Youngest First</option>
                <option value="dateOfAdmission-desc">Admission: Newest</option>
                <option value="name-asc">Patient Name (A-Z)</option>
              </select>
            </div>
            <button
              onClick={handleResetFilters}
              id="reset-filters-btn"
              title="Reset all filters"
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Mandatory Decision Support Disclaimer */}
        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>
              <strong>Disclaimer:</strong> Prototype decision-support score based on available patient data. Not a clinical diagnosis.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            EnrollLive Decision Support
          </span>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div>
          Showing <strong>{patients.length > 0 ? (filters.page - 1) * filters.pageSize + 1 : 0}</strong> -{' '}
          <strong>{Math.min(filters.page * filters.pageSize, totalCount)}</strong> of{' '}
          <strong className="text-slate-900">{totalCount.toLocaleString()}</strong> patients
        </div>

        {/* Page Size Select */}
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            id="page-size-select"
            value={filters.pageSize}
            onChange={(e) => setFilters(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
            className="text-xs py-1 px-2 rounded-md border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs w-full max-w-full" id="patient-data-table-container">
        <div className="w-full overflow-x-auto table-scrollbar max-w-full">
          <table className="w-full text-left text-xs min-w-[850px] xl:min-w-full" id="patient-data-table">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-2.5 w-[80px]">Patient ID</th>
                <th className="py-2.5 px-2.5 min-w-[130px]">Name</th>
                <th className="py-2.5 px-2 w-[50px]">Age</th>
                <th className="py-2.5 px-2 w-[65px]">Gender</th>
                <th className="py-2.5 px-2.5 min-w-[110px]">Condition</th>
                <th className="py-2.5 px-2.5 w-[95px]">Admission</th>
                <th className="py-2.5 px-2.5 w-[90px]">Test Result</th>
                <th className="py-2.5 px-2 text-center w-[120px]">Screening Risk</th>
                <th className="py-2.5 px-2 text-center w-[110px]">Screening Score</th>
                <th className="py-2.5 px-2.5 text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading records from local database...</span>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-600">No matching patients found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 font-semibold text-xs hover:bg-sky-100 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const isHigh = patient.riskLevel === 'High';
                  const isMedium = patient.riskLevel === 'Medium';
                  const riskBadgeClass = isHigh
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : isMedium
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  const admissionClass = patient.admissionType.toLowerCase().includes('emergency')
                    ? 'bg-rose-100 text-rose-800'
                    : patient.admissionType.toLowerCase().includes('urgent')
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700';

                  return (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectPatient(patient)}
                    >
                      {/* Patient ID */}
                      <td className="py-2.5 px-2.5 font-mono text-slate-600 font-medium whitespace-nowrap">
                        {patient.id}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate max-w-[140px]">
                            {patient.name}
                          </span>
                          {patient.readmissionTarget === 1 && (
                            <span 
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0"
                              title={`Readmitted ${patient.readmissionDays || 14} days post-discharge: ${patient.readmissionReason || ''}`}
                            >
                              🚨 Return ({patient.readmissionDays || 14}d)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Age */}
                      <td className="py-2.5 px-2 font-medium text-slate-800">
                        {patient.age}
                      </td>

                      {/* Gender */}
                      <td className="py-2.5 px-2 text-slate-600">
                        {patient.gender}
                      </td>

                      {/* Medical Condition */}
                      <td className="py-2.5 px-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100 truncate max-w-[125px]">
                          {patient.medicalCondition}
                        </span>
                      </td>

                      {/* Admission Type */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${admissionClass}`}>
                          {patient.admissionType}
                        </span>
                      </td>

                      {/* Test Result */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                          patient.testResults.toLowerCase() === 'abnormal'
                            ? 'bg-rose-100 text-rose-700'
                            : patient.testResults.toLowerCase() === 'inconclusive'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {patient.testResults}
                        </span>
                      </td>

                      {/* Screening Risk */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${riskBadgeClass}`}>
                          {patient.riskLevel} Screening Risk
                        </span>
                      </td>

                      {/* Screening Score */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 font-mono text-xs">
                          {patient.riskScore} / 100
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectPatient(patient)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="View Patient Details & Risk Assessment"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isDoctor && (
                            <button
                              onClick={() => {
                                setEditingPatient(patient);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 rounded-md hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors"
                              title="Edit Patient Details & Clinical Reports"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                            </button>
                          )}
                          <button
                            onClick={() => onExplainPatient(patient)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold border border-sky-200 transition-colors"
                            title="Why This Patient? (AI Risk Explanation)"
                          >
                            <Sparkles className="w-3 h-3 text-sky-600" />
                            <span>🧠 Why This Patient?</span>
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Page <strong className="text-slate-900">{filters.page}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={filters.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Quick jump to page buttons */}
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pNum = i + 1;
                if (totalPages > 5 && filters.page > 3) {
                  pNum = filters.page - 3 + i;
                  if (pNum + 4 > totalPages) {
                    pNum = totalPages - 4 + i;
                  }
                }
                if (pNum <= 0 || pNum > totalPages) return null;

                return (
                  <button
                    key={pNum}
                    onClick={() => setFilters(prev => ({ ...prev, page: pNum }))}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                      filters.page === pNum
                        ? 'bg-sky-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
              disabled={filters.page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enroll Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={(newPatient) => {
          setFilters(prev => ({ ...prev, page: 1 }));
          onSelectPatient(newPatient);
        }}
      />

      {/* Edit Patient Modal for Doctor */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        patient={editingPatient}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPatient(null);
        }}
        onPatientUpdated={(updated) => {
          setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
        }}
      />
    </div>
  );
};
