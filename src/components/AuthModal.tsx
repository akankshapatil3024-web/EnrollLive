import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  UserCheck,
  Mail,
  Lock,
  User,
  Building,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogOut,
  UserPlus,
  KeyRound,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClinicianRole, PatientRecord } from '../types';
import { computePatientRisk } from '../services/riskEngine';
import { insertPatientsBatch } from '../services/db';
import { syncPatientToFirestore } from '../services/firebase';

export const AuthModal: React.FC = () => {
  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsDemo,
    loginAsPatient,
    registerAsPatient,
    loginAsDemoPatient,
    logout,
    databaseConnected,
    isDoctor,
    isPatient,
  } = useAuth();

  // Top-level tab: Doctor vs Patient
  const [activePortal, setActivePortal] = useState<'doctor' | 'patient'>('doctor');
  // Sub-tab: Sign In vs Sign Up
  const [actionTab, setActionTab] = useState<'signin' | 'signup'>('signin');

  // Doctor Form fields
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docName, setDocName] = useState('');
  const [docRole, setDocRole] = useState<ClinicianRole>('physician');
  const [docDepartment, setDocDepartment] = useState('Cardiology & Chronic Disease');

  // Patient Form fields
  const [patIdOrEmail, setPatIdOrEmail] = useState('');
  const [patPassword, setPatPassword] = useState('');
  const [patName, setPatName] = useState('');
  const [patAge, setPatAge] = useState(65);
  const [patGender, setPatGender] = useState<'Female' | 'Male'>('Female');
  const [patCondition, setPatCondition] = useState('Diabetes');
  const [patRegEmail, setPatRegEmail] = useState('');
  const [patRegPassword, setPatRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (actionTab === 'signin') {
        if (!docEmail || !docPassword) {
          throw new Error('Please provide your doctor/staff email and password.');
        }
        await loginWithEmail(docEmail, docPassword);
      } else {
        if (!docEmail || !docPassword || !docName) {
          throw new Error('Please fill in all physician registration fields.');
        }
        await registerWithEmail(docEmail, docPassword, docName, docRole, docDepartment);
      }
    } catch (err: any) {
      console.error('Doctor auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (actionTab === 'signin') {
        if (!patIdOrEmail) {
          throw new Error('Please enter your Patient ID (e.g. PID-00001) or Email address.');
        }
        await loginAsPatient(patIdOrEmail, patPassword || 'PatientSecurePass123!');
      } else {
        if (!patName || !patRegEmail || !patRegPassword) {
          throw new Error('Please provide your full name, email, and password.');
        }

        // Generate a new clinical patient record
        const newPatientId = `PID-${Date.now().toString().slice(-6)}`;
        const admissionDate = new Date().toISOString().slice(0, 10);
        const dischargeDate = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);

        const calculated = computePatientRisk({
          age: Number(patAge),
          admissionType: 'Urgent',
          testResults: 'Abnormal',
          medicalCondition: patCondition,
          lengthOfStayDays: 4,
        });

        const newPatient: PatientRecord = {
          id: newPatientId,
          name: patName.trim(),
          age: Number(patAge),
          gender: patGender,
          bloodType: 'O+',
          medicalCondition: patCondition,
          dateOfAdmission: admissionDate,
          dischargeDate,
          doctor: 'Dr. Sarah Rao, MD',
          hospital: 'Metro Health Medical Center',
          insuranceProvider: 'Medicare Choice',
          billingAmount: 19400,
          roomNumber: 312,
          admissionType: 'Urgent',
          medication: 'Lipitor',
          testResults: 'Abnormal',
          lengthOfStayDays: 4,
          riskScore: calculated.riskScore,
          riskLevel: calculated.riskLevel,
          contributingFactors: calculated.contributingFactors,
          readmissionTarget: calculated.riskScore >= 60 ? 1 : 0,
          clinicalNotes: `Patient enrolled self-registration portal on ${new Date().toLocaleDateString()}. Initial post-discharge screening initiated.`,
        };

        // Persist locally and in Cloud Firestore
        await insertPatientsBatch([newPatient]);
        try {
          await syncPatientToFirestore(newPatient);
        } catch (e) {
          console.warn('Sync to firestore failed on patient signup:', e);
        }

        // Register patient auth profile
        await registerAsPatient({
          name: patName.trim(),
          email: patRegEmail.trim(),
          password: patRegPassword,
          patientId: newPatientId,
        });
      }
    } catch (err: any) {
      console.error('Patient auth error:', err);
      setErrorMsg(err.message || 'Unable to log in or register. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="auth-modal-backdrop"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        id="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-slate-900 text-white p-5 relative shrink-0">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            id="close-auth-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
              EnrollLive Clinical Portal
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold">Sign In &amp; Account Access</h2>
          <p className="text-xs text-sky-100/90 mt-0.5">
            Secure multi-role access with Cloud Firestore patient records and privacy isolation.
          </p>

          {/* Top Tabs: DOCTOR vs PATIENT */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-black/20 rounded-xl gap-1">
            <button
              type="button"
              id="tab-doctor-portal"
              onClick={() => {
                setActivePortal('doctor');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'doctor'
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor / Clinician Portal</span>
            </button>

            <button
              type="button"
              id="tab-patient-portal"
              onClick={() => {
                setActivePortal('patient');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activePortal === 'patient'
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>Patient Portal</span>
            </button>
          </div>
        </div>

        {/* Sub Tabs: Sign In vs Sign Up */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-6 shrink-0 text-xs font-bold">
          <button
            type="button"
            id="subtab-signin"
            onClick={() => {
              setActionTab('signin');
              setErrorMsg(null);
            }}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              actionTab === 'signin'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            id="subtab-signup"
            onClick={() => {
              setActionTab('signup');
              setErrorMsg(null);
            }}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              actionTab === 'signup'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up (New {activePortal === 'doctor' ? 'Doctor' : 'Patient'})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Session status if already logged in */}
          {currentUser && (
            <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{currentUser.displayName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-800 uppercase">
                      {currentUser.accountType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {currentUser.patientId ? `Linked ID: ${currentUser.patientId}` : currentUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch / Sign Out</span>
              </button>
            </div>
          )}

          {/* ========================================== */}
          {/* DOCTOR / CLINICIAN VIEW                    */}
          {/* ========================================== */}
          {activePortal === 'doctor' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-900">Doctor Privileges:</span> Full access to all patients, early warning alerts, analytics, reports, plus full editing and patient enrollment.
              </div>

              {actionTab === 'signin' ? (
                <>
                  {/* 1-Click Quick Demo Doctor Sign-In */}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      1-Click Instant Doctor Demo Sign-In
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => loginAsDemo('dr_rao')}
                        className="p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all text-left group"
                      >
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-700">
                          Dr. Sarah Rao, MD
                        </span>
                        <span className="block text-[11px] text-slate-500">Cardiology</span>
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                          Physician
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => loginAsDemo('nurse_patil')}
                        className="p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all text-left group"
                      >
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-700">
                          Maya Patil, RN
                        </span>
                        <span className="block text-[11px] text-slate-500">Transitional Care</span>
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Nurse
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => loginAsDemo('dr_vance')}
                        className="p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all text-left group"
                      >
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-700">
                          Dr. Marcus Vance
                        </span>
                        <span className="block text-[11px] text-slate-500">Quality Admin</span>
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                          Admin
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">
                      or sign in with clinical email
                    </span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>

                  <form onSubmit={handleDoctorSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Physician / Staff Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={docEmail}
                          onChange={(e) => setDocEmail(e.target.value)}
                          placeholder="doctor@hospital.org"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          value={docPassword}
                          onChange={(e) => setDocPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Verifying...' : 'Sign In as Doctor'}</span>
                    </button>
                  </form>
                </>
              ) : (
                /* Doctor Sign Up */
                <form onSubmit={handleDoctorSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Doctor / Clinician Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="Dr. Gregory House, MD"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Clinical Role
                      </label>
                      <select
                        value={docRole}
                        onChange={(e) => setDocRole(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="physician">Attending Physician</option>
                        <option value="nurse">Nurse / Coordinator</option>
                        <option value="case_manager">Case Manager</option>
                        <option value="administrator">Quality Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hospital Department
                      </label>
                      <input
                        type="text"
                        value={docDepartment}
                        onChange={(e) => setDocDepartment(e.target.value)}
                        placeholder="Internal Medicine"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hospital Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                      placeholder="physician@hospital.org"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={docPassword}
                      onChange={(e) => setDocPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Registering...' : 'Complete Doctor Registration'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* PATIENT VIEW                               */}
          {/* ========================================== */}
          {activePortal === 'patient' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <span className="font-bold">Patient Privacy Policy:</span> When signed in as a patient, you can ONLY view your own personal health records, risk screening indicators, prescribed medications, and clinical report.
              </div>

              {actionTab === 'signin' ? (
                <>
                  {/* 1-Click Quick Demo Patient Sign-In */}
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      1-Click Sample Patient Logins
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => loginAsDemoPatient('margaret')}
                        className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
                      >
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                          Margaret Sullivan
                        </span>
                        <span className="block text-[11px] text-slate-500">PID-00001 (Diabetes)</span>
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                          High Risk (78)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => loginAsDemoPatient('robert')}
                        className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
                      >
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                          Robert Martinez
                        </span>
                        <span className="block text-[11px] text-slate-500">PID-00002 (Hypertension)</span>
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          Medium (55)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => loginAsDemoPatient('james')}
                        className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
                      >
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                          James Wilson
                        </span>
                        <span className="block text-[11px] text-slate-500">PID-00003 (Asthma)</span>
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Low Risk (28)
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium">
                      or sign in with your patient ID or email
                    </span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>

                  <form onSubmit={handlePatientSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Patient ID or Email *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={patIdOrEmail}
                          onChange={(e) => setPatIdOrEmail(e.target.value)}
                          placeholder="e.g. PID-00001 or patient@email.com"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password / Access Key
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={patPassword}
                          onChange={(e) => setPatPassword(e.target.value)}
                          placeholder="•••••••• (or leave blank for demo ID)"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Verifying...' : 'Sign In as Patient'}</span>
                    </button>
                  </form>
                </>
              ) : (
                /* Patient Sign Up */
                <form onSubmit={handlePatientSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={patName}
                      onChange={(e) => setPatName(e.target.value)}
                      placeholder="e.g. Patricia Adams"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={110}
                        value={patAge}
                        onChange={(e) => setPatAge(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                      <select
                        value={patGender}
                        onChange={(e) => setPatGender(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                      <select
                        value={patCondition}
                        onChange={(e) => setPatCondition(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Diabetes">Diabetes</option>
                        <option value="Hypertension">Hypertension</option>
                        <option value="Asthma">Asthma</option>
                        <option value="Arthritis">Arthritis</option>
                        <option value="Cancer">Cancer</option>
                        <option value="Obesity">Obesity</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={patRegEmail}
                      onChange={(e) => setPatRegEmail(e.target.value)}
                      placeholder="patricia@gmail.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={patRegPassword}
                      onChange={(e) => setPatRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Creating...' : 'Enroll & Sign Up as Patient'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Database Status */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                databaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Cloud Firestore: ai-studio-remixremixenroll...</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
