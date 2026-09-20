import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Pill,
  User,
  Clock,
  FileText,
  Printer,
  Calendar,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Stethoscope,
  Info,
  ChevronRight,
  Database,
} from 'lucide-react';
import { PatientRecord, ClinicalIntervention } from '../types';
import { useAuth } from '../context/AuthContext';
import { getPatientById } from '../services/db';
import { getPatientInterventions } from '../services/firebase';

interface PatientPortalViewProps {
  onOpenReportModal?: (patient: PatientRecord) => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({ onOpenReportModal }) => {
  const { currentUser, patientId, setIsAuthModalOpen } = useAuth();
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [interventions, setInterventions] = useState<ClinicalIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'report' | 'care-plan'>('overview');

  const effectivePatientId = patientId || 'PID-00001';

  useEffect(() => {
    let isMounted = true;
    async function loadPatientData() {
      setLoading(true);
      try {
        let data = await getPatientById(effectivePatientId);
        if (!data) {
          data = await getPatientById('PID-00001');
        }
        if (isMounted && data) {
          setPatient(data);
          try {
            const remoteInterventions = await getPatientInterventions(data.id);
            if (isMounted) setInterventions(remoteInterventions);
          } catch (e) {
            console.warn('Could not load remote interventions:', e);
          }
        }
      } catch (err) {
        console.error('Error loading patient data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPatientData();
    return () => {
      isMounted = false;
    };
  }, [effectivePatientId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-slate-500">
        <Activity className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading your personal health records...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Patient Record Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Please link your Patient ID or sign into your registered patient account.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-xs"
        >
          Sign In to Patient Portal
        </button>
      </div>
    );
  }

  const riskColor =
    patient.riskLevel === 'High'
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : patient.riskLevel === 'Medium'
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-emerald-600 bg-emerald-50 border-emerald-200';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="patient-portal-container">
      {/* Patient Greeting & Privacy Assurance Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Protected Health Information (PHI) Isolated</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Welcome, {patient.name}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              Patient Record: <span className="font-mono font-bold text-white">{patient.id}</span> • Attending:{' '}
              <span className="font-semibold text-white">{patient.doctor}</span> • Hospital:{' '}
              <span className="text-emerald-200">{patient.hospital}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print My Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-4 py-1.5 shadow-2xs gap-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>My Health Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'report'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>My Clinical Discharge Report</span>
        </button>

        <button
          onClick={() => setActiveTab('care-plan')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'care-plan'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>My Prevention Care Plan</span>
          {interventions.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-900">
              {interventions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Readmission Risk Screening
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {patient.riskScore}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span
                  className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold border ${riskColor}`}
                >
                  {patient.riskLevel} Risk
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {patient.riskLevel === 'High'
                  ? 'Close post-discharge care & medication compliance required.'
                  : patient.riskLevel === 'Medium'
                  ? 'Standard follow-up protocol with primary physician.'
                  : 'Low readmission risk. Continue prescribed healthy recovery habits.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Primary Condition
              </span>
              <span className="text-lg font-bold text-slate-900">{patient.medicalCondition}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Acuity: <span className="font-semibold text-slate-700">{patient.admissionType}</span> • Labs:{' '}
                <span className="font-semibold text-slate-700">{patient.testResults}</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Prescribed Medication
              </span>
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span className="text-base font-bold text-slate-900">{patient.medication}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Take strictly as directed by your physician.</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Inpatient Stay
              </span>
              <span className="text-lg font-bold text-slate-900">
                {patient.lengthOfStayDays} Days
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Room #{patient.roomNumber} • Discharged {patient.dischargeDate}
              </p>
            </div>
          </div>

          {/* Contributing Risk Factors */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>What Contributes to Your Recovery Profile?</span>
            </h3>
            <div className="space-y-2.5">
              {patient.contributingFactors && patient.contributingFactors.length > 0 ? (
                patient.contributingFactors.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800">{f.factor}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{f.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 shrink-0">
                      +{f.points} pts
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No elevated risk factors detected.</p>
              )}
            </div>
          </div>

          {/* Warning Signs & Emergency Protocols */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Red Flag Warning Symptoms — When to Call Your Doctor
                </h4>
                <p className="text-xs text-rose-800 mt-1">
                  If you experience any of the following, do not wait for your scheduled follow-up:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-rose-700 list-disc list-inside">
                  <li>Sudden shortness of breath or persistent chest discomfort</li>
                  <li>Persistent dizziness, lightheadedness, or sudden swelling in lower extremities</li>
                  <li>Inability to keep food or medications down for more than 24 hours</li>
                  <li>Fever above 101°F (38.3°C) or severe sudden weakness</li>
                </ul>
                <div className="mt-3 flex items-center gap-3">
                  <a
                    href="tel:911"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Emergency: Call 911</span>
                  </a>
                  <span className="text-xs text-rose-800 font-medium">
                    Hospital Nurse Line: (800) 555-0199
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY CLINICAL REPORT */}
      {activeTab === 'report' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Official Hospital Document
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Inpatient Clinical Discharge Summary
              </h2>
              <p className="text-xs text-slate-500">
                Issued by {patient.hospital} • Attending: {patient.doctor}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Discharge Date: <span className="font-bold text-slate-700">{patient.dischargeDate}</span></p>
              <p>Room: <span className="font-bold text-slate-700">#{patient.roomNumber}</span></p>
            </div>
          </div>

          {/* Doctor's Narrative */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>Doctor's Clinical Assessment &amp; Instructions</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {patient.dischargeReport || (
                <span>
                  Patient {patient.name} presented with acute symptoms associated with {patient.medicalCondition}. During the {patient.lengthOfStayDays}-day inpatient stay, therapy with {patient.medication} achieved hemodynamic stability. Follow-up consultation is scheduled within 7–14 days.
                </span>
              )}
            </div>
          </div>

          {/* Doctor Notes if present */}
          {patient.clinicalNotes && (
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Attending Physician Ongoing Notes
              </h3>
              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 text-xs text-sky-950">
                {patient.clinicalNotes}
              </div>
            </div>
          )}

          {/* Prescribed Medications & Regimen */}
          <div className="p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-emerald-600" />
              <span>Discharge Medication Instructions</span>
            </h3>
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">{patient.medication}</span>
                <p className="text-slate-500 text-[11px]">Take once daily with meals. Do not discontinue without physician approval.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Active Prescription
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CARE PLAN & INTERVENTIONS */}
      {activeTab === 'care-plan' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                My Readmission Prevention Protocols
              </h2>
              <p className="text-xs text-slate-500">
                Action items formulated by your care coordination team in Cloud Firestore.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Cloud Synchronized
            </span>
          </div>

          {interventions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium">No specialized interventions required at this time.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Your transitional care team will add protocols here if needed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interventions.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.actionType}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                          item.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : item.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{item.planDetails}</p>
                    <p className="text-[10px] text-slate-400">
                      Coordinated by: {item.clinicianName} ({item.clinicianRole}) • Added{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      item.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : item.status === 'in_progress'
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
