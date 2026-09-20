import React, { useState } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  Database,
  Activity,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PatientRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { computePatientRisk } from '../services/riskEngine';
import { syncPatientToFirestore, logClinicalAuditAction } from '../services/firebase';
import { insertPatientsBatch } from '../services/db';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (patient: PatientRecord) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded,
}) => {
  const { currentUser, setIsAuthModalOpen, databaseConnected } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(62);
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [bloodType, setBloodType] = useState('O+');
  const [medicalCondition, setMedicalCondition] = useState('Diabetes');
  const [admissionType, setAdmissionType] = useState<'Emergency' | 'Urgent' | 'Elective'>('Emergency');
  const [medication, setMedication] = useState('Lipitor');
  const [testResults, setTestResults] = useState<'Normal' | 'Abnormal' | 'Inconclusive'>('Abnormal');
  const [lengthOfStay, setLengthOfStay] = useState<number>(5);
  const [doctor, setDoctor] = useState(currentUser?.displayName || 'Dr. Sarah Rao, MD');
  const [hospital, setHospital] = useState('Metro Health Medical Center');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate live risk score preview
  const liveRisk = computePatientRisk({
    age: Number(age),
    admissionType,
    testResults,
    medicalCondition,
    lengthOfStayDays: Number(lengthOfStay),
  });
  const liveRiskScore = liveRisk.riskScore;
  const liveRiskLevel = liveRisk.riskLevel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Patient full name is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const patientId = `PID-${Date.now().toString().slice(-6)}`;
      const admissionDate = new Date().toISOString().slice(0, 10);
      const dischargeDate = new Date(Date.now() + lengthOfStay * 86400000).toISOString().slice(0, 10);

      const calculated = computePatientRisk({
        age: Number(age),
        admissionType,
        testResults,
        medicalCondition,
        lengthOfStayDays: Number(lengthOfStay),
      });

      const newPatient: PatientRecord = {
        id: patientId,
        name: name.trim(),
        age: Number(age),
        gender,
        bloodType,
        medicalCondition,
        dateOfAdmission: admissionDate,
        doctor,
        hospital,
        insuranceProvider: 'Medicare Choice',
        billingAmount: 18500 + Math.floor(Math.random() * 8000),
        roomNumber: 300 + Math.floor(Math.random() * 99),
        admissionType,
        dischargeDate,
        medication,
        testResults,
        lengthOfStayDays: Number(lengthOfStay),
        riskScore: calculated.riskScore,
        riskLevel: calculated.riskLevel,
        contributingFactors: calculated.contributingFactors,
        readmissionTarget: calculated.riskScore >= 65 ? 1 : 0,
      };

      // 1. Insert into local storage / IndexedDB
      await insertPatientsBatch([newPatient]);

      // 2. Persist to Cloud Firestore
      try {
        await syncPatientToFirestore(newPatient);
      } catch (firestoreErr) {
        console.warn('Could not sync to cloud firestore immediately:', firestoreErr);
      }

      // 3. Clinical Audit Log
      if (currentUser) {
        await logClinicalAuditAction(
          'ENROLL_PATIENT',
          currentUser.uid,
          currentUser.displayName,
          `Enrolled new patient ${newPatient.name} (${newPatient.id}) with screening score ${newPatient.riskScore} (${newPatient.riskLevel})`,
          newPatient.id
        );
      }

      onPatientAdded(newPatient);
      onClose();
    } catch (err: any) {
      console.error('Error saving patient:', err);
      setErrorMsg(err.message || 'Failed to save patient record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="add-patient-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        id="add-patient-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 to-slate-800 text-white p-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <UserPlus className="w-4 h-4 text-sky-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
              Inpatient Enrollment &amp; Cloud Sync
            </span>
          </div>
          <h2 className="text-lg font-bold">Enroll New Patient Profile</h2>
          <p className="text-xs text-sky-100/90 mt-0.5">
            Evaluate real-time readmission risk metrics and store directly into Cloud Firestore.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Real-time calculated risk preview banner */}
          <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-sky-600" />
              <div>
                <span className="text-xs font-bold text-slate-800">Calculated Screening Score</span>
                <p className="text-[11px] text-slate-500">Based on clinical acuity and comorbidities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 font-mono">{liveRiskScore}/100</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  liveRiskLevel === 'High'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : liveRiskLevel === 'Medium'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {liveRiskLevel} Risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Margaret Sullivan"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                required
                min={1}
                max={110}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Medical Condition
              </label>
              <select
                value={medicalCondition}
                onChange={(e) => setMedicalCondition(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Diabetes">Diabetes</option>
                <option value="Hypertension">Hypertension</option>
                <option value="Asthma">Asthma</option>
                <option value="Arthritis">Arthritis</option>
                <option value="Cancer">Cancer</option>
                <option value="Obesity">Obesity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Acuity Type
              </label>
              <select
                value={admissionType}
                onChange={(e) => setAdmissionType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Emergency">Emergency (+30 pts)</option>
                <option value="Urgent">Urgent (+20 pts)</option>
                <option value="Elective">Elective (+5 pts)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discharge Diagnostic Labs
              </label>
              <select
                value={testResults}
                onChange={(e) => setTestResults(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Abnormal">Abnormal (+25 pts)</option>
                <option value="Inconclusive">Inconclusive (+15 pts)</option>
                <option value="Normal">Normal (+0 pts)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prescribed Medication
              </label>
              <select
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Lipitor">Lipitor</option>
                <option value="Aspirin">Aspirin</option>
                <option value="Penicillin">Penicillin</option>
                <option value="Ibuprofen">Ibuprofen</option>
                <option value="Paracetamol">Paracetamol</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Length of Inpatient Stay (Days)
              </label>
              <input
                type="number"
                required
                min={1}
                max={60}
                value={lengthOfStay}
                onChange={(e) => setLengthOfStay(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attending Physician
              </label>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              <span>Persists to Cloud Firestore database</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Enrolling & Syncing...' : 'Enroll & Sync to Cloud'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
