export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface ContributingFactor {
  factor: string;
  points: number;
  category: 'Age' | 'Admission' | 'Condition' | 'Test Results' | 'Length of Stay' | 'Intervention';
  description: string;
}

export interface PatientRecord {
  id: string; // e.g. "PID-00001" or numeric id
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  medicalCondition: string;
  dateOfAdmission: string;
  dischargeDate: string;
  doctor: string;
  hospital: string;
  insuranceProvider: string;
  billingAmount: number;
  roomNumber: string | number;
  admissionType: string; // Emergency, Urgent, Elective
  medication: string;
  testResults: string; // Normal, Abnormal, Inconclusive
  lengthOfStayDays: number;
  
  // Risk screening calculations
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  contributingFactors: ContributingFactor[];

  // Readmission Tracking & Outcomes
  readmissionTarget?: number | null; // 1 = readmitted, 0 = not readmitted, null = not available
  readmissionDays?: number; // Days to 30-day readmission (e.g. 14 days)
  readmissionDate?: string; // Date readmitted (e.g. "2024-03-24")
  readmissionReason?: string; // Clinical diagnosis/cause of readmission
  readmissionAcuity?: 'Emergency' | 'Urgent' | 'Direct Inpatient';

  // Doctor-editable clinical notes and discharge report summary
  clinicalNotes?: string;
  dischargeReport?: string;
}

export interface PatientFilterState {
  searchQuery: string;
  ageRange: 'all' | 'under-30' | '30-49' | '50-64' | '65-plus';
  medicalCondition: string;
  admissionType: string;
  riskLevel: 'all' | 'Low' | 'Medium' | 'High';
  testResults: string;
  readmissionStatus?: 'all' | 'readmitted' | 'not-readmitted';
  sortBy: 'id' | 'riskScore' | 'age' | 'dateOfAdmission' | 'name' | 'billingAmount' | 'readmissionDays';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface DatasetStatistics {
  totalPatients: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  avgRiskScore: number;
  avgAge: number;
  emergencyPercentage: number;
  abnormalTestPercentage: number;
  readmittedCount: number;
  readmissionRate: number;
  avgDaysToReadmission: number;
  hasGenuineTarget: boolean;
  targetColumnName: string | null;
  conditionsCount: Record<string, number>;
  admissionTypesCount: Record<string, number>;
  riskDistributionCount: Record<string, number>;
  testResultsCount: Record<string, number>;
  ageGroupsCount: Record<string, number>;
}

export interface ModelMetrics {
  hasTargetLabel: boolean;
  targetColumnName: string | null;
  totalEvaluated: number;
  trainSize: number;
  testSize: number;
  readmissionRate: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
    trueNegatives: number;
  };
}

export interface AiExplanationResult {
  summary: string;
  clinicalDrivers: string[];
  monitoringSuggestions: string[];
  redFlagSymptoms: string[];
}

export type ExplanationLanguage = 'en' | 'hi' | 'mr';

export type AppView = 'dashboard' | 'patients' | 'early-warning' | 'analytics' | 'evaluation' | 'reports' | 'my-health';

export type ThemeMode = 'light' | 'dark' | 'system';

export type UserAccountType = 'doctor' | 'patient';

export type ClinicianRole = 'physician' | 'nurse' | 'case_manager' | 'administrator' | 'analyst';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  accountType: UserAccountType; // 'doctor' or 'patient'
  role: ClinicianRole | 'patient';
  department?: string;
  patientId?: string; // If patient, links to their PatientRecord.id
  photoURL?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ClinicalIntervention {
  id: string;
  patientId: string;
  patientName: string;
  clinicianId: string;
  clinicianName: string;
  clinicianRole: ClinicianRole;
  actionType: string;
  planDetails: string;
  priority: 'urgent' | 'high' | 'routine';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  patientId?: string;
  details: string;
  timestamp: string;
}
