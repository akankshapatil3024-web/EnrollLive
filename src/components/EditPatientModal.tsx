import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  ShieldCheck,
  Database,
  Activity,
  AlertCircle,
  Sparkles,
  Save,
  FileText,
  Stethoscope,
} from 'lucide-react';
import { PatientRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { computePatientRisk } from '../services/riskEngine';
import { syncPatientToFirestore, logClinicalAuditAction } from '../services/firebase';
import { updatePatientRecord } from '../services/db';

interface EditPatientModalProps {
  patient: PatientRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated: (updatedPatient: PatientRecord) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  patient,
  isOpen,
  onClose,
  onPatientUpdated,
}) => {
  const { currentUser, isDoctor } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState(65);
  const [gender, setGender] = useState('Female');
  const [bloodType, setBloodType] = useState('O+');
  const [medicalCondition, setMedicalCondition] = useState('Diabetes');
  const [admissionType, setAdmissionType] = useState('Emergency');
  const [testResults, setTestResults] = useState('Abnormal');
  const [medication, setMedication] = useState('Lipitor');
  const [lengthOfStay, setLengthOfStay] = useState(4);
  const [doctor, setDoctor] = useState('');
  const [hospital, setHospital] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [dischargeReport, setDischargeReport] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-populate fields when modal opens
  useEffect(() => {
    if (patient) {
      setName(patient.name || '');
      setAge(patient.age || 60);
      setGender(patient.gender || 'Female');
      setBloodType(patient.bloodType || 'O+');
      setMedicalCondition(patient.medicalCondition || 'Diabetes');
      setAdmissionType(patient.admissionType || 'Emergency');
      setTestResults(patient.testResults || 'Abnormal');
      setMedication(patient.medication || 'Lipitor');
      setLengthOfStay(patient.lengthOfStayDays || 4);
      setDoctor(patient.doctor || 'Dr. Sarah Rao, MD');
      setHospital(patient.hospital || 'Metro Health Medical Center');
      setClinicalNotes(patient.clinicalNotes || '');
      setDischargeReport(
        patient.dischargeReport ||
          `Patient ${patient.name} admitted with acute exacerbation of ${patient.medicalCondition}. Responded to initial inpatient stabilization with ${patient.medication}. Discharge criteria met with scheduled transitional follow-up.`
      );
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  // Live calculated risk preview
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
      setErrorMsg('Patient full name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const calculated = computePatientRisk({
        age: Number(age),
        admissionType,
        testResults,
        medicalCondition,
        lengthOfStayDays: Number(lengthOfStay),
      });

      const updatedRecord: PatientRecord = {
        ...patient,
        name: name.trim(),
        age: Number(age),
        gender,
        bloodType,
        medicalCondition,
        doctor: doctor.trim(),
        hospital: hospital.trim(),
        admissionType,
        medication,
        testResults,
        lengthOfStayDays: Number(lengthOfStay),
        riskScore: calculated.riskScore,
        riskLevel: calculated.riskLevel,
        contributingFactors: calculated.contributingFactors,
        readmissionTarget: calculated.riskScore >= 60 ? 1 : 0,
        clinicalNotes: clinicalNotes.trim(),
        dischargeReport: dischargeReport.trim(),
      };

      // 1. Update in local IndexedDB
      await updatePatientRecord(updatedRecord);

      // 2. Sync to Cloud Firestore
      try {
        await syncPatientToFirestore(updatedRecord);
      } catch (firestoreErr) {
        console.warn('Could not sync update to Cloud Firestore immediately:', firestoreErr);
      }

      // 3. Clinical Audit Log
      if (currentUser) {
        await logClinicalAuditAction(
          'EDIT_PATIENT',
          currentUser.uid,
          currentUser.displayName,
          `Updated clinical details & reports for ${updatedRecord.name} (${updatedRecord.id}). Risk updated to ${updatedRecord.riskScore} (${updatedRecord.riskLevel})`,
          updatedRecord.id
        );
      }

      onPatientUpdated(updatedRecord);
      onClose();
    } catch (err: any) {
      console.error('Failed to update patient:', err);
      setErrorMsg(err.message || 'Failed to update patient record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="edit-patient-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        id="edit-patient-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-slate-900 text-white p-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <Edit3 className="w-4 h-4 text-sky-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
              Doctor Clinical Editor &amp; Report Management
            </span>
          </div>
          <h2 className="text-lg font-bold">
            Edit Patient Details &amp; Report ({patient.id})
          </h2>
          <p className="text-xs text-sky-100/90 mt-0.5">
            Modify clinical metrics, attending physician notes, and post-discharge narrative with Cloud Firestore sync.
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

          {/* Live Recalculated Score Card */}
          <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-sky-600" />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Live Screening Recalculation
                </span>
                <p className="text-[11px] text-slate-500">
                  Dynamic risk model automatically recalculates upon metric edits
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 font-mono">
                {liveRiskScore}/100
              </span>
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
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
                onChange={(e) => setAdmissionType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Emergency">Emergency</option>
                <option value="Urgent">Urgent</option>
                <option value="Elective">Elective</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnostic Lab Results
              </label>
              <select
                value={testResults}
                onChange={(e) => setTestResults(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Abnormal">Abnormal</option>
                <option value="Inconclusive">Inconclusive</option>
                <option value="Normal">Normal</option>
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
                Length of Stay (Days)
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

          {/* Doctor's Clinical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Doctor's Clinical Notes &amp; Observations</span>
            </label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter ongoing clinical observations, risk factors, or follow-up requirements..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Discharge Report Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Discharge Clinical Report &amp; Patient Instructions</span>
            </label>
            <textarea
              rows={3}
              value={dischargeReport}
              onChange={(e) => setDischargeReport(e.target.value)}
              placeholder="Detailed discharge narrative visible on patient reports..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Footer Save */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              <span>Saves to local indexed storage and Cloud Firestore</span>
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
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving Changes...' : 'Save & Sync Patient'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
