import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Database,
  Send,
  Sparkles,
  Lock,
} from 'lucide-react';
import { PatientRecord, ClinicalIntervention } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  createClinicalIntervention,
  subscribePatientInterventions,
  updateInterventionStatus,
  logClinicalAuditAction,
} from '../services/firebase';

interface PatientInterventionsTabProps {
  patient: PatientRecord;
}

export const PatientInterventionsTab: React.FC<PatientInterventionsTabProps> = ({ patient }) => {
  const { currentUser, setIsAuthModalOpen, databaseConnected } = useAuth();
  const [interventions, setInterventions] = useState<ClinicalIntervention[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [actionType, setActionType] = useState('48-Hour Transition Phone Follow-Up');
  const [planDetails, setPlanDetails] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'routine'>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suggested preset interventions based on patient risk
  const presetPlans = [
    {
      type: 'Medication Reconciliation',
      details: `Review high-risk medication adherence for ${patient.medication}. Confirm pharmacy delivery and patient comprehension.`,
      priority: 'urgent' as const,
    },
    {
      type: '48-Hour Transition Phone Follow-Up',
      details: `Clinical nurse outreach within 48h of discharge to evaluate symptom stability for ${patient.medicalCondition}.`,
      priority: 'high' as const,
    },
    {
      type: 'Primary Care Appointment Scheduling',
      details: `Ensure 7-day follow-up consultation is confirmed prior to hospital discharge.`,
      priority: 'high' as const,
    },
    {
      type: 'Home Health Aide Referral',
      details: `Arrange in-home care assessment for elderly patient with mobility and chronic disease support needs.`,
      priority: 'routine' as const,
    },
  ];

  // Subscribe to real-time interventions from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribePatientInterventions(patient.id, (list) => {
      setInterventions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patient.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planDetails.trim()) return;

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await createClinicalIntervention({
        patientId: patient.id,
        patientName: patient.name,
        clinicianId: currentUser.uid,
        clinicianName: currentUser.displayName,
        clinicianRole: currentUser.role === 'patient' ? 'case_manager' : currentUser.role,
        actionType,
        planDetails: planDetails.trim(),
        priority,
        status: 'pending',
      });

      await logClinicalAuditAction(
        'CREATE_INTERVENTION',
        currentUser.uid,
        currentUser.displayName,
        `Created ${priority} intervention (${actionType}) for patient ${patient.id}`,
        patient.id
      );

      setPlanDetails('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create intervention in Firestore:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (intervention: ClinicalIntervention) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const nextStatus: Record<string, 'pending' | 'in_progress' | 'completed'> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    const newStatus = nextStatus[intervention.status];

    try {
      await updateInterventionStatus(intervention.id, newStatus);
      await logClinicalAuditAction(
        'UPDATE_INTERVENTION',
        currentUser.uid,
        currentUser.displayName,
        `Updated intervention ${intervention.id} status to ${newStatus}`,
        patient.id
      );
    } catch (err) {
      console.error('Failed to update status in Firestore:', err);
    }
  };

  return (
    <div className="space-y-4" id="patient-interventions-container">
      {/* Cloud Firestore Sync Header */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900">Cloud Firestore Care Plans</span>
            <p className="text-[11px] text-slate-500">
              Real-time multi-clinician readmission prevention interventions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-sky-200 text-[11px] font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentUser.displayName.split(' ')[0]}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-sky-300 text-sky-700 font-bold text-[11px] hover:bg-sky-50 shadow-2xs"
            >
              <Lock className="w-3 h-3" />
              Sign in to author
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'New Plan'}</span>
          </button>
        </div>
      </div>

      {/* Add Intervention Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl border border-sky-200 bg-white shadow-sm space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800">
              Log Readmission Prevention Intervention
            </span>
            <span className="text-[10px] font-mono text-slate-400">Target: {patient.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Intervention Type
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="48-Hour Transition Phone Follow-Up">48-Hour Transition Phone Follow-Up</option>
                <option value="Medication Reconciliation">Medication Reconciliation</option>
                <option value="Primary Care Appointment Scheduling">Primary Care Appointment Scheduling</option>
                <option value="Home Health Aide Referral">Home Health Aide Referral</option>
                <option value="Specialist Outpatient Referral">Specialist Outpatient Referral</option>
                <option value="Telehealth Monitoring Equipment">Telehealth Monitoring Equipment</option>
                <option value="Social Determinants & Transportation Support">Social Determinants &amp; Transportation</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Clinical Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
              >
                <option value="urgent">Urgent (Within 24 Hours)</option>
                <option value="high">High (Within 48-72 Hours)</option>
                <option value="routine">Routine (Standard Discharge Protocol)</option>
              </select>
            </div>
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Suggested Clinical Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetPlans.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActionType(p.type);
                    setPlanDetails(p.details);
                    setPriority(p.priority);
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-[10px] font-medium text-slate-700 transition-colors border border-slate-200"
                >
                  + {p.type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Care Plan &amp; Transition Protocol Details
            </label>
            <textarea
              required
              rows={2}
              value={planDetails}
              onChange={(e) => setPlanDetails(e.target.value)}
              placeholder="Detail specific follow-up instructions, physician to coordinate with, or warning signs to monitor..."
              className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !planDetails.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving to Cloud...' : 'Commit to Firestore'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Interventions List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Cloud Firestore interventions...
          </div>
        ) : interventions.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">No care plan recorded yet for this patient</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
              Screening score is {patient.riskScore}/100. Click "New Plan" or pick a clinical preset above to log an intervention in Cloud Firestore.
            </p>
          </div>
        ) : (
          interventions.map((item) => {
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';

            const priorityBadge =
              item.priority === 'urgent'
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : item.priority === 'high'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200';

            const statusBadge =
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : isInProgress
                ? 'bg-sky-100 text-sky-800 border-sky-200'
                : 'bg-amber-50 text-amber-800 border-amber-200';

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50/60 border-slate-200 opacity-80'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-slate-900">{item.actionType}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${priorityBadge} uppercase`}>
                        {item.priority}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(item)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusBadge} flex items-center gap-1 hover:opacity-80 transition-opacity`}
                        title="Click to toggle status: Pending -> In Progress -> Completed"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : isInProgress ? (
                          <Clock className="w-3 h-3 text-sky-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        )}
                        <span className="capitalize">{item.status.replace('_', ' ')}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mb-2">{item.planDetails}</p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.clinicianName} ({item.clinicianRole})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
