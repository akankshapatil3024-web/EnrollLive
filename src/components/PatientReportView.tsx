import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  User, 
  Activity, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  Calendar, 
  ArrowRight,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { PatientRecord, RiskLevel, AiExplanationResult } from '../types';
import { queryPatients } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { EditPatientModal } from './EditPatientModal';

interface PatientReportViewProps {
  initialPatient?: PatientRecord | null;
  onSelectPatientForDetails: (patient: PatientRecord) => void;
  onExplainPatient: (patient: PatientRecord) => void;
}

export const PatientReportView: React.FC<PatientReportViewProps> = ({
  initialPatient,
  onSelectPatientForDetails,
  onExplainPatient,
}) => {
  const { isDoctor } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(initialPatient || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientList, setPatientList] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    async function searchCohort() {
      setLoading(true);
      try {
        const res = await queryPatients({
          searchQuery: searchQuery.trim(),
          page: 1,
          pageSize: 8,
          sortBy: 'riskScore',
          sortOrder: 'desc',
        });
        setPatientList(res.patients);
        if (!selectedPatient && res.patients.length > 0) {
          setSelectedPatient(res.patients[0]);
        }
      } catch (err) {
        console.error('Error fetching patients for report generator:', err);
      } finally {
        setLoading(false);
      }
    }
    searchCohort();
  }, [searchQuery]);

  const p = selectedPatient;
  const isHigh = p?.riskLevel === 'High';
  const isMedium = p?.riskLevel === 'Medium';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!p) return;
    const reportText = `==================================================================
PATIENT READMISSION RISK SCREENING REPORT
EnrollLive Clinical Decision-Support Prototype
Date: ${new Date().toLocaleString()}
==================================================================

PATIENT IDENTIFICATION
------------------------------------------------------------------
Patient ID:             ${p.id}
Full Name:              ${p.name}
Age / Gender:           ${p.age} years | ${p.gender}
Blood Type:             ${p.bloodType}
Hospital:               ${p.hospital}
Attending Physician:    ${p.doctor}
Room Number:            ${p.roomNumber}
Insurance:              ${p.insuranceProvider}
Billing Amount:         $${p.billingAmount.toLocaleString()}
Admission:              ${p.dateOfAdmission}
Discharge:              ${p.dischargeDate || 'Active'}
Length of Stay:         ${p.lengthOfStayDays} day(s)

CLINICAL PRESENTATION
------------------------------------------------------------------
Primary Condition:      ${p.medicalCondition}
Admission Type:         ${p.admissionType}
Discharge Test Result:  ${p.testResults}
Current Medication:     ${p.medication}

RISK EVALUATION
------------------------------------------------------------------
Risk Score:             ${p.riskScore}%
Risk Classification:    ${p.riskLevel.toUpperCase()} RISK
Review Priority:        ${isHigh ? 'Requires Attention / Review' : 'Routine Clinical Review'}

Contributing Risk Factors:
${p.contributingFactors.map((f, i) => `  ${i + 1}. [${f.category}] ${f.factor} (+${f.points} pts) - ${f.description}`).join('\n')}

AI CLINICAL EXPLANATION
------------------------------------------------------------------
"This patient's risk indicator is elevated because several available risk factors are present, including ${p.admissionType.toLowerCase()} admission presentation, ${p.testResults.toLowerCase()} discharge lab indicators, and chronic ${p.medicalCondition.toLowerCase()} management requiring structured follow-up."

FOLLOW-UP SUGGESTIONS
------------------------------------------------------------------
• Consider closer monitoring during first 7-14 days post-discharge
• Review discharge and medication follow-up requirements
• Schedule appropriate outpatient clinic appointment

==================================================================
MANDATORY DISCLAIMER:
This prototype is intended for healthcare decision support and educational demonstration. It does not replace qualified medical professionals or clinical judgment.
==================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Risk_Report_${p.id}_${p.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="reports-view-container">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              One-Click Patient Risk Report Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate, print, and export formalized clinical decision-support summaries for any patient encounter.
          </p>
        </div>

        {p && (
          <div className="flex items-center gap-2">
            {isDoctor && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-colors shadow-2xs"
              >
                <Edit3 className="w-4 h-4 text-sky-600" />
                <span>Edit Patient &amp; Report</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Text</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Patient Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 print:hidden">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Select Patient to Generate Report
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (e.g. P001) or Name..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {patientList.map((patient) => {
              const selected = p?.id === patient.id;
              const isH = patient.riskLevel === 'High';
              const isM = patient.riskLevel === 'Medium';

              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    selected
                      ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{patient.id}</span>
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[130px]">{patient.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {patient.medicalCondition} • {patient.age}y
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                      isH ? 'bg-rose-50 text-rose-700 border-rose-200' : isM ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {patient.riskScore}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full Report Document Preview */}
        <div className="lg:col-span-2">
          {p ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 print:border-none print:shadow-none print:p-0">
              {/* Document Header */}
              <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="text-sky-700 font-bold text-xs tracking-wider uppercase block">
                    EnrollLive Clinical Decision Support
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    Patient Readmission Risk Screening Report
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hospital Inpatient Readmission Stratification &amp; Discharge Screening
                  </p>
                </div>

                <div className="text-left sm:text-right font-mono text-xs text-slate-500 space-y-0.5">
                  <div><strong>Report ID:</strong> RPT-{p.id}</div>
                  <div><strong>Generated:</strong> {new Date().toLocaleDateString()}</div>
                  <div><strong>Facility:</strong> {p.hospital}</div>
                </div>
              </div>

              {/* 1. Patient Information */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>1. Patient Demographic &amp; Encounter Record</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Patient ID:</span>
                    <span className="font-bold text-slate-900 font-mono">{p.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Full Name:</span>
                    <span className="font-bold text-slate-900">{p.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Age / Gender:</span>
                    <span className="font-bold text-slate-900">{p.age} yrs • {p.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Blood Type:</span>
                    <span className="font-mono font-bold text-slate-900">{p.bloodType}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Medical Condition:</span>
                    <span className="font-bold text-slate-900">{p.medicalCondition}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Admission Type:</span>
                    <span className="font-bold text-slate-900">{p.admissionType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Test Results:</span>
                    <span className={`font-bold ${p.testResults === 'Abnormal' ? 'text-rose-700' : 'text-slate-900'}`}>
                      {p.testResults}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Length of Stay:</span>
                    <span className="font-bold text-sky-700">{p.lengthOfStayDays} days</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Attending Doctor:</span>
                    <span className="font-medium text-slate-900">{p.doctor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Room / Bed:</span>
                    <span className="font-mono text-slate-900">Room #{p.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Insurance:</span>
                    <span className="font-medium text-slate-900">{p.insuranceProvider}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Medication:</span>
                    <span className="font-medium text-slate-900">{p.medication}</span>
                  </div>
                </div>
              </div>

              {/* 2. Readmission Risk Evaluation */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  <span>2. Readmission Risk Stratification</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Screening Score</span>
                    <div className={`text-4xl font-extrabold font-mono mt-1 ${isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {p.riskScore}%
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Assigned Tier</span>
                    <div className="mt-2">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase border ${
                        isHigh ? 'bg-rose-100 text-rose-800 border-rose-200' : isMedium ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {p.riskLevel} RISK
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Review Status</span>
                    <div className={`text-sm font-bold mt-2 ${isHigh ? 'text-rose-700' : 'text-slate-800'}`}>
                      {isHigh ? 'Requires Attention / Review' : 'Routine Clinical Review'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Contributing Factors */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  3. Major Contributing Risk Factors
                </h3>

                <div className="space-y-2">
                  {p.contributingFactors.map((factor, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between text-xs gap-3">
                      <div>
                        <span className="font-bold text-slate-900 block">{factor.factor}</span>
                        <span className="text-slate-600 text-[11px] mt-0.5 block">{factor.description}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 shrink-0">
                        +{factor.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. AI Explanation */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>4. Clinical AI Explanation</span>
                </h3>

                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 text-xs text-slate-800 leading-relaxed italic">
                  &ldquo;This patient presents with an elevated readmission risk score driven by acute {p.admissionType.toLowerCase()} admission, {p.testResults.toLowerCase()} discharge test results, and ongoing clinical management for chronic {p.medicalCondition.toLowerCase()}. Coordinated post-discharge follow-up is recommended.&rdquo;
                </div>
              </div>

              {/* 5. Follow-Up Suggestions */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>5. General Follow-Up &amp; Monitoring Suggestions</span>
                </h3>

                <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-5">
                  <li>Schedule outpatient clinical review within 7-14 days post-discharge.</li>
                  <li>Perform comprehensive medication reconciliation before discharge.</li>
                  <li>Educate patient and caregivers on primary condition warning signs.</li>
                  <li>Establish telephone check-in within 48-72 hours of discharge.</li>
                </ul>
              </div>

              {/* 6. Mandatory Disclaimer */}
              <div className="pt-4 border-t-2 border-slate-800 text-center">
                <p className="text-xs font-semibold text-slate-700 max-w-2xl mx-auto leading-relaxed">
                  &ldquo;This prototype is intended for healthcare decision support and educational demonstration. It does not replace qualified medical professionals or clinical judgment.&rdquo;
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold">Select a patient from the list to preview report</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Patient & Report Modal for Doctors */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        patient={selectedPatient}
        onClose={() => setIsEditModalOpen(false)}
        onPatientUpdated={(updated) => {
          setSelectedPatient(updated);
          setPatientList(prev => prev.map(item => item.id === updated.id ? updated : item));
        }}
      />
    </div>
  );
};
