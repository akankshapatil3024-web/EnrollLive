import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Info,
  ShieldCheck,
  User,
  Activity
} from 'lucide-react';
import { PatientRecord, RiskLevel } from '../types';
import { computePatientRisk } from '../services/riskEngine';

interface WhatIfSimulatorProps {
  patient: PatientRecord;
  onUpdateSimulatedPatient?: (updated: PatientRecord) => void;
  onOpenReport?: (patient: PatientRecord) => void;
}

const ADMISSION_OPTIONS = ['Emergency', 'Urgent', 'Elective'];
const TEST_RESULT_OPTIONS = ['Normal', 'Abnormal', 'Inconclusive'];
const CONDITION_OPTIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Cancer', 'Obesity'];

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  patient,
  onOpenReport,
}) => {
  // Simulated state editable fields
  const [simAge, setSimAge] = useState<number>(patient.age);
  const [simAdmissionType, setSimAdmissionType] = useState<string>(patient.admissionType);
  const [simTestResults, setSimTestResults] = useState<string>(patient.testResults);
  const [simCondition, setSimCondition] = useState<string>(patient.medicalCondition);
  const [simLengthOfStay, setSimLengthOfStay] = useState<number>(patient.lengthOfStayDays || 3);

  // Compute live simulated risk using the application's risk/model logic
  const simulatedRisk = computePatientRisk({
    age: simAge,
    admissionType: simAdmissionType,
    testResults: simTestResults,
    medicalCondition: simCondition,
    lengthOfStayDays: simLengthOfStay,
  });

  const currentRiskScore = patient.riskScore;
  const currentRiskLevel = patient.riskLevel;
  const simScore = simulatedRisk.riskScore;
  const simLevel = simulatedRisk.riskLevel;
  const scoreDiff = simScore - currentRiskScore;

  // Reset to original patient values
  const handleReset = () => {
    setSimAge(patient.age);
    setSimAdmissionType(patient.admissionType);
    setSimTestResults(patient.testResults);
    setSimCondition(patient.medicalCondition);
    setSimLengthOfStay(patient.lengthOfStayDays || 3);
  };

  const getRiskColor = (level: RiskLevel) => {
    if (level === 'High') return 'text-rose-600 bg-rose-50 border-rose-200';
    if (level === 'Medium') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getRiskTextColor = (level: RiskLevel) => {
    if (level === 'High') return 'text-rose-600';
    if (level === 'Medium') return 'text-amber-600';
    return 'text-emerald-600';
  };

  // Construct simulated patient object for reporting
  const simulatedPatientRecord: PatientRecord = {
    ...patient,
    age: simAge,
    admissionType: simAdmissionType,
    testResults: simTestResults,
    medicalCondition: simCondition,
    lengthOfStayDays: simLengthOfStay,
    riskScore: simScore,
    riskLevel: simLevel,
    contributingFactors: simulatedRisk.contributingFactors,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden" id="what-if-simulator-container">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50/60 via-indigo-50/40 to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              🔮 What-If Risk Simulator
            </h2>
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              {patient.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate hypothetical changes to admission acuity, lab results, and patient factors to observe risk model response.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Reset to original patient parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
          {onOpenReport && (
            <button
              type="button"
              onClick={() => onOpenReport(simulatedPatientRecord)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs"
            >
              <span>Export Simulated Report</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Comparison Hero Display: CURRENT RISK vs. SIMULATED RISK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="what-if-comparison-hero">
          {/* Current Risk Box */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  CURRENT RISK
                </span>
                <span className="text-xs text-slate-400 font-medium">Actual Encounter</span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className={`text-4xl font-extrabold font-mono ${getRiskTextColor(currentRiskLevel)}`}>
                  {currentRiskScore}
                </span>
                <span className="text-slate-400 text-xl font-bold">—</span>
                <span className={`text-sm font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getRiskColor(currentRiskLevel)}`}>
                  {currentRiskLevel}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Admission:</span>
                <span className="font-semibold text-slate-800">{patient.admissionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Test Result:</span>
                <span className="font-semibold text-slate-800">{patient.testResults}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Condition &amp; Age:</span>
                <span className="font-semibold text-slate-800">{patient.medicalCondition} ({patient.age} yrs)</span>
              </div>
            </div>
          </div>

          {/* Simulated Risk Box */}
          <div className={`p-5 rounded-xl border-2 flex flex-col justify-between transition-all ${
            simLevel === 'High'
              ? 'border-rose-300 bg-rose-50/40'
              : simLevel === 'Medium'
              ? 'border-amber-300 bg-amber-50/40'
              : 'border-emerald-300 bg-emerald-50/40'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>SIMULATED RISK</span>
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {scoreDiff === 0 ? (
                    <span className="text-slate-500">No change</span>
                  ) : scoreDiff < 0 ? (
                    <span className="text-emerald-700 flex items-center gap-0.5 font-bold">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {scoreDiff} pts ({Math.abs(scoreDiff)}% lower)
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-0.5 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{scoreDiff} pts ({scoreDiff}% higher)
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-3">
                <span className={`text-4xl font-extrabold font-mono ${getRiskTextColor(simLevel)}`}>
                  {simScore}
                </span>
                <span className="text-slate-400 text-xl font-bold">—</span>
                <span className={`text-sm font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getRiskColor(simLevel)}`}>
                  {simLevel}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Simulated Admission:</span>
                <span className="font-semibold text-slate-900">{simAdmissionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Simulated Test Result:</span>
                <span className="font-semibold text-slate-900">{simTestResults}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Simulated Condition:</span>
                <span className="font-semibold text-slate-900">{simCondition} ({simAge} yrs)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ⚠️ Mandatory Simulation Disclaimer */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Simulation only — not a clinical prediction.</span>
            <span className="text-amber-800 ml-1">
              This interactive tool models the sensitivity of the screening algorithm. Adjusting parameters does not imply that changing a single clinical parameter will actually reduce a patient&apos;s biological readmission probability.
            </span>
          </div>
        </div>

        {/* Interactive Simulation Controls */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            ADJUST CLINICAL PARAMETERS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Admission Type Selector */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Admission Type
              </label>
              <select
                id="whatif-admission-type-select"
                value={simAdmissionType}
                onChange={(e) => setSimAdmissionType(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
              >
                {ADMISSION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} {opt === 'Emergency' ? '(+25 pts)' : opt === 'Urgent' ? '(+15 pts)' : '(+5 pts)'}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block">
                Original: <strong className="text-slate-700">{patient.admissionType}</strong>
              </span>
            </div>

            {/* Test Results Selector */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Discharge Test Results
              </label>
              <select
                id="whatif-test-results-select"
                value={simTestResults}
                onChange={(e) => setSimTestResults(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
              >
                {TEST_RESULT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} {opt === 'Abnormal' ? '(+25 pts)' : opt === 'Inconclusive' ? '(+15 pts)' : '(+5 pts)'}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block">
                Original: <strong className="text-slate-700">{patient.testResults}</strong>
              </span>
            </div>

            {/* Medical Condition Selector */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Primary Medical Condition
              </label>
              <select
                id="whatif-condition-select"
                value={simCondition}
                onChange={(e) => setSimCondition(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} {['Cancer', 'Diabetes'].includes(opt) ? '(High chronic impact)' : '(Standard chronic impact)'}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block">
                Original: <strong className="text-slate-700">{patient.medicalCondition}</strong>
              </span>
            </div>

            {/* Age Slider */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-2 lg:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  Patient Age: <span className="font-mono text-sky-700 font-extrabold text-sm">{simAge} years</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Original: {patient.age} yrs
                </span>
              </div>
              <input
                id="whatif-age-slider"
                type="range"
                min="18"
                max="95"
                value={simAge}
                onChange={(e) => setSimAge(parseInt(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>18 (Young Adult)</span>
                <span>50 (Mature)</span>
                <span>65 (Senior)</span>
                <span>75+ (Geriatric)</span>
              </div>
            </div>

            {/* Length of Stay Slider */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  Inpatient Stay: <span className="font-mono text-sky-700 font-extrabold text-sm">{simLengthOfStay} days</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Original: {patient.lengthOfStayDays}d
                </span>
              </div>
              <input
                id="whatif-los-slider"
                type="range"
                min="1"
                max="30"
                value={simLengthOfStay}
                onChange={(e) => setSimLengthOfStay(parseInt(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 day</span>
                <span>7 days</span>
                <span>14+ days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Simulated Factor Weights */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Simulated Factor Breakdown ({simulatedRisk.contributingFactors.length} drivers active)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {simulatedRisk.contributingFactors.map((f, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="font-semibold text-slate-700">{f.factor}</span>
                </div>
                <span className="font-mono font-bold text-sky-700">+{f.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
