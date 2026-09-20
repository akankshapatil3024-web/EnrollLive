import React, { useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  HeartPulse, 
  Building2, 
  User, 
  Calendar, 
  ShieldAlert, 
  Activity, 
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { AiExplanationResult, PatientRecord } from '../types';

interface PatientReportModalProps {
  patient: PatientRecord | null;
  onClose: () => void;
  aiExplanation?: AiExplanationResult | null;
}

export const PatientReportModal: React.FC<PatientReportModalProps> = ({
  patient,
  onClose,
  aiExplanation,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!patient) return null;

  const isHigh = patient.riskLevel === 'High';
  const isMedium = patient.riskLevel === 'Medium';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const reportText = `==================================================================
PATIENT READMISSION RISK SCREENING REPORT
EnrollLive Clinical Decision-Support Prototype
Generated: ${new Date().toLocaleString()}
==================================================================

1. PATIENT IDENTIFICATION & ENCOUNTER INFORMATION
------------------------------------------------------------------
Patient ID:             ${patient.id}
Full Name:              ${patient.name}
Age / Gender:           ${patient.age} years | ${patient.gender}
Blood Type:             ${patient.bloodType}
Hospital / Facility:    ${patient.hospital}
Attending Physician:    ${patient.doctor}
Room Number:            ${patient.roomNumber}
Insurance Provider:     ${patient.insuranceProvider}
Billing Amount:         $${patient.billingAmount.toLocaleString()}
Admission Date:         ${patient.dateOfAdmission}
Discharge Date:         ${patient.dischargeDate || 'Active'}
Length of Stay:         ${patient.lengthOfStayDays} day(s)

2. CLINICAL PROFILE & PRESENTATION
------------------------------------------------------------------
Primary Condition:      ${patient.medicalCondition}
Admission Type:         ${patient.admissionType}
Discharge Test Results: ${patient.testResults}
Prescribed Medication:  ${patient.medication}

3. RISK SCREENING EVALUATION
------------------------------------------------------------------
Prototype Risk Score:   ${patient.riskScore}%
Risk Classification:    ${patient.riskLevel.toUpperCase()} RISK
Priority Status:        ${isHigh ? 'Requires Attention / Review' : 'Routine Clinical Review'}

Major Contributing Risk Factors:
${patient.contributingFactors.map((f, i) => `  ${i + 1}. [${f.category}] ${f.factor} (+${f.points} pts) - ${f.description}`).join('\n')}

4. EXPLAINABLE AI ANALYSIS (GEMINI CLINICAL SYNTHESIS)
------------------------------------------------------------------
Summary:
${aiExplanation?.summary || `This patient's risk indicator is elevated because several available risk factors are present, including ${patient.admissionType.toLowerCase()} admission presentation, ${patient.testResults.toLowerCase()} discharge lab indicators, and chronic ${patient.medicalCondition.toLowerCase()} management.`}

Clinical Drivers Identified:
${(aiExplanation?.clinicalDrivers || patient.contributingFactors.map(f => f.factor)).map(d => `  • ${d}`).join('\n')}

5. GENERAL FOLLOW-UP & MONITORING SUGGESTIONS
------------------------------------------------------------------
${(aiExplanation?.monitoringSuggestions || [
  'Schedule outpatient follow-up consultation within 7-14 days post-discharge.',
  'Conduct structured medication reconciliation and ensure patient understanding.',
  'Provide chronic disease symptom log and designated clinic hotline contact.'
]).map(s => `  • ${s}`).join('\n')}

Red-Flag Warning Indicators:
${(aiExplanation?.redFlagSymptoms || [
  'Acute exacerbation of primary chronic condition symptoms.',
  'Difficulty breathing, chest pain, or sudden dizziness.',
  'Persistent fever or failure to tolerate oral medications.'
]).map(r => `  • ${r}`).join('\n')}

==================================================================
MANDATORY CLINICAL DISCLAIMER
------------------------------------------------------------------
This prototype is intended for healthcare decision support and educational demonstration. It does not replace qualified medical professionals or clinical judgment.
==================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Risk_Report_${patient.id}_${patient.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:bg-white" 
      id="patient-report-modal"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[min(92vh,760px)] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Action Header (Hidden in Print) */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <span className="font-bold text-slate-800 text-sm sm:text-base">
              Patient Readmission Risk Screening Report
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Download text report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download TXT</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Document Body */}
        <div 
          ref={printRef}
          className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1 min-h-0 text-slate-900 table-scrollbar print:overflow-visible print:p-6"
        >
          {/* Document Header */}
          <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                <HeartPulse className="w-5 h-5" />
                <span>EnrollLive Clinical Decision Support</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Patient Readmission Risk Screening Report
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital Inpatient Readmission Stratification &amp; Discharge Screening
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-500 space-y-0.5">
              <div><strong>Report ID:</strong> RPT-{patient.id}-{Date.now().toString().slice(-4)}</div>
              <div><strong>Generated:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Facility:</strong> {patient.hospital}</div>
            </div>
          </div>

          {/* Section 1: Patient Information */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Patient Demographic &amp; Encounter Record</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Patient ID:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{patient.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Full Name:</span>
                <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Age / Gender:</span>
                <span className="font-bold text-slate-900">{patient.age} yrs • {patient.gender}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Blood Type:</span>
                <span className="font-mono font-bold text-slate-900">{patient.bloodType}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Medical Condition:</span>
                <span className="font-bold text-slate-900">{patient.medicalCondition}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Admission Type:</span>
                <span className="font-bold text-slate-900">{patient.admissionType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Test Results:</span>
                <span className={`font-bold ${
                  patient.testResults === 'Abnormal' ? 'text-rose-700' : 'text-slate-900'
                }`}>
                  {patient.testResults}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Length of Stay:</span>
                <span className="font-bold text-sky-700">{patient.lengthOfStayDays} days</span>
              </div>

              <div>
                <span className="text-slate-500 block">Attending Doctor:</span>
                <span className="font-medium text-slate-900">{patient.doctor}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Room / Bed:</span>
                <span className="font-mono text-slate-900">Room #{patient.roomNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Insurance:</span>
                <span className="font-medium text-slate-900">{patient.insuranceProvider}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Medication:</span>
                <span className="font-medium text-slate-900">{patient.medication}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Readmission Risk Assessment */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>2. Readmission Risk Stratification</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Screening Score</span>
                <div className={`text-4xl font-extrabold font-mono mt-1 ${
                  isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {patient.riskScore}%
                </div>
                <span className="text-[10px] text-slate-400">0 to 100% scale</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Assigned Tier</span>
                <div className="mt-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase border ${
                    isHigh 
                      ? 'bg-rose-100 text-rose-800 border-rose-200' 
                      : isMedium 
                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {patient.riskLevel} RISK
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">Standardized clinical threshold</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Review Status</span>
                <div className={`text-sm font-bold mt-2 ${isHigh ? 'text-rose-700' : 'text-slate-800'}`}>
                  {isHigh ? 'Requires Attention / Review' : 'Routine Outpatient Protocol'}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Decision-support classification</span>
              </div>
            </div>
          </div>

          {/* Section 3: Major Contributing Factors */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
              <span>3. Major Contributing Risk Factors</span>
            </h2>

            <div className="space-y-2">
              {patient.contributingFactors.map((factor, idx) => (
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

          {/* Section 4: AI Explanation */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>4. Clinical AI Explanation (Decision Support)</span>
            </h2>

            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 text-xs text-slate-800 leading-relaxed italic">
              &ldquo;{aiExplanation?.summary || `This patient presents with an elevated readmission risk score driven by acute ${patient.admissionType.toLowerCase()} admission, ${patient.testResults.toLowerCase()} discharge test results, and ongoing clinical management for chronic ${patient.medicalCondition.toLowerCase()}. Coordinated post-discharge follow-up is recommended.`}&rdquo;
            </div>

            {aiExplanation?.clinicalDrivers && aiExplanation.clinicalDrivers.length > 0 && (
              <div className="pl-3 border-l-2 border-sky-300 text-xs text-slate-600 space-y-1">
                {aiExplanation.clinicalDrivers.map((driver, i) => (
                  <div key={i}>• {driver}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Follow-Up Suggestions */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>5. General Follow-Up &amp; Monitoring Suggestions</span>
            </h2>

            <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-5">
              {(aiExplanation?.monitoringSuggestions || [
                'Schedule outpatient clinical review within 7-14 days post-discharge.',
                'Perform comprehensive medication reconciliation before discharge.',
                'Educate patient and caregivers on primary condition warning signs.',
                'Establish telephone check-in within 48-72 hours of discharge.'
              ]).map((s, idx) => (
                <li key={idx} className="leading-relaxed">{s}</li>
              ))}
            </ul>
          </div>

          {/* Section 6: Mandatory Prototype Disclaimer */}
          <div className="pt-4 border-t-2 border-slate-800 text-center">
            <p className="text-xs font-semibold text-slate-700 max-w-2xl mx-auto leading-relaxed">
              &ldquo;This prototype is intended for healthcare decision support and educational demonstration. It does not replace qualified medical professionals or clinical judgment.&rdquo;
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <span>EnrollLive Healthcare Decision Support</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
