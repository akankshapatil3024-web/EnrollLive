import { ContributingFactor, PatientRecord, RiskLevel } from '../types';

/**
 * Readmission Risk Screening Prototype Calculation Engine
 * 
 * Clinical screening heuristic informed by LACE index and HOSPITAL score principles:
 * - Age bracket (physiological vulnerability and reduced functional reserve)
 * - Admission acuity (Emergency / Urgent vs Elective)
 * - Discharge laboratory / test results (Abnormal indicator of incomplete resolution)
 * - Chronic comorbidity type (Cancer, Diabetes, Hypertension, etc.)
 * - Inpatient Length of Stay (LOS)
 * 
 * IMPORTANT:
 * Risk score is a prototype decision-support indicator and not a clinical diagnosis.
 */

export function calculateLengthOfStay(admissionDate: string, dischargeDate: string): number {
  if (!admissionDate) return 3; // sensible clinical median fallback
  const start = new Date(admissionDate).getTime();
  const end = dischargeDate ? new Date(dischargeDate).getTime() : start + (3 * 86400000);
  if (isNaN(start) || isNaN(end) || end < start) {
    return 3;
  }
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(days, 60));
}

export function computePatientRisk(
  rawPatient: {
    age: number;
    admissionType: string;
    testResults: string;
    medicalCondition: string;
    lengthOfStayDays: number;
    scheduledFollowup7Days?: boolean;
    medicationAdherencePlan?: boolean;
  }
): {
  riskScore: number;
  riskLevel: RiskLevel;
  contributingFactors: ContributingFactor[];
} {
  const factors: ContributingFactor[] = [];
  let totalPoints = 0;

  // 1. Age Scoring (Max 25 pts)
  const age = Number(rawPatient.age) || 45;
  if (age >= 75) {
    const pts = 25;
    totalPoints += pts;
    factors.push({
      factor: `Geriatric Age Cohort (${age} yrs)`,
      points: pts,
      category: 'Age',
      description: 'Patients aged 75+ have heightened post-discharge vulnerability and frailty risks.',
    });
  } else if (age >= 65) {
    const pts = 18;
    totalPoints += pts;
    factors.push({
      factor: `Senior Age (${age} yrs)`,
      points: pts,
      category: 'Age',
      description: 'Ages 65-74 correlate with increased multi-morbidity and 30-day readmission.',
    });
  } else if (age >= 50) {
    const pts = 10;
    totalPoints += pts;
    factors.push({
      factor: `Mature Adult (${age} yrs)`,
      points: pts,
      category: 'Age',
      description: 'Moderate age-associated chronic disease baseline.',
    });
  } else {
    const pts = 4;
    totalPoints += pts;
    factors.push({
      factor: `Young Adult (${age} yrs)`,
      points: pts,
      category: 'Age',
      description: 'Lower physiological baseline vulnerability.',
    });
  }

  // 2. Admission Type (Max 25 pts)
  const adm = (rawPatient.admissionType || '').trim().toLowerCase();
  if (adm.includes('emergency')) {
    const pts = 25;
    totalPoints += pts;
    factors.push({
      factor: 'Emergency Admission',
      points: pts,
      category: 'Admission',
      description: 'Unplanned acute emergency presentations carry significantly higher readmission likelihood.',
    });
  } else if (adm.includes('urgent')) {
    const pts = 15;
    totalPoints += pts;
    factors.push({
      factor: 'Urgent Admission',
      points: pts,
      category: 'Admission',
      description: 'Semi-acute unscheduled admission requiring expedited clinical stabilization.',
    });
  } else {
    const pts = 5;
    totalPoints += pts;
    factors.push({
      factor: 'Elective Admission',
      points: pts,
      category: 'Admission',
      description: 'Planned procedure with structured pre-operative and post-discharge plan.',
    });
  }

  // 3. Test Results (Max 25 pts)
  const test = (rawPatient.testResults || '').trim().toLowerCase();
  if (test.includes('abnormal')) {
    const pts = 25;
    totalPoints += pts;
    factors.push({
      factor: 'Abnormal Test Results',
      points: pts,
      category: 'Test Results',
      description: 'Out-of-range clinical biomarkers indicate active decompensation or ongoing pathological stress.',
    });
  } else if (test.includes('inconclusive')) {
    const pts = 12;
    totalPoints += pts;
    factors.push({
      factor: 'Inconclusive Diagnostic Labs',
      points: pts,
      category: 'Test Results',
      description: 'Uncertain diagnostic parameters require enhanced vigilance and follow-up repeat testing.',
    });
  } else {
    const pts = 3;
    totalPoints += pts;
    factors.push({
      factor: 'Normal Lab Findings',
      points: pts,
      category: 'Test Results',
      description: 'Standard physiological parameters at time of discharge evaluation.',
    });
  }

  // 4. Chronic Condition / Comorbidity (Max 20 pts)
  const cond = (rawPatient.medicalCondition || '').trim().toLowerCase();
  if (cond.includes('cancer')) {
    const pts = 20;
    totalPoints += pts;
    factors.push({
      factor: 'Oncology / Cancer',
      points: pts,
      category: 'Condition',
      description: 'Immunosuppressive and high symptom burden leading to recurrent acute episodes.',
    });
  } else if (cond.includes('diabetes')) {
    const pts = 18;
    totalPoints += pts;
    factors.push({
      factor: 'Diabetes Mellitus',
      points: pts,
      category: 'Condition',
      description: 'Complex metabolic disease with elevated risk of glycemic variability and vascular complications.',
    });
  } else if (cond.includes('hypertension')) {
    const pts = 15;
    totalPoints += pts;
    factors.push({
      factor: 'Hypertension',
      points: pts,
      category: 'Condition',
      description: 'Cardiovascular hemodynamic stress, requiring continuous medication adherence and monitoring.',
    });
  } else if (cond.includes('asthma')) {
    const pts = 13;
    totalPoints += pts;
    factors.push({
      factor: 'Bronchial Asthma',
      points: pts,
      category: 'Condition',
      description: 'Reactive airway vulnerability triggered by environmental allergens and respiratory infections.',
    });
  } else if (cond.includes('obesity')) {
    const pts = 11;
    totalPoints += pts;
    factors.push({
      factor: 'Clinical Obesity',
      points: pts,
      category: 'Condition',
      description: 'Systemic metabolic load predisposing to cardiopulmonary strain and delayed recovery.',
    });
  } else if (cond.includes('arthritis')) {
    const pts = 9;
    totalPoints += pts;
    factors.push({
      factor: 'Rheumatoid / Osteoarthritis',
      points: pts,
      category: 'Condition',
      description: 'Chronic inflammatory musculoskeletal impairment impacting post-discharge mobility.',
    });
  } else {
    const pts = 10;
    totalPoints += pts;
    factors.push({
      factor: rawPatient.medicalCondition || 'Chronic Condition',
      points: pts,
      category: 'Condition',
      description: 'Documented chronic medical condition under active clinical management.',
    });
  }

  // 5. Length of Stay (Max 15 pts)
  const los = rawPatient.lengthOfStayDays || 3;
  if (los >= 14) {
    const pts = 15;
    totalPoints += pts;
    factors.push({
      factor: `Prolonged Stay (${los} days)`,
      points: pts,
      category: 'Length of Stay',
      description: 'Extended hospitalization (> 14 days) strongly correlates with deconditioning and nosocomial risks.',
    });
  } else if (los >= 7) {
    const pts = 10;
    totalPoints += pts;
    factors.push({
      factor: `Moderate Inpatient Stay (${los} days)`,
      points: pts,
      category: 'Length of Stay',
      description: 'Inpatient duration reflecting moderate complexity of primary acute episode.',
    });
  } else if (los >= 3) {
    const pts = 5;
    totalPoints += pts;
    factors.push({
      factor: `Short Acute Stay (${los} days)`,
      points: pts,
      category: 'Length of Stay',
      description: 'Standard 3-6 day course for stabilized chronic disease admissions.',
    });
  } else {
    const pts = 2;
    totalPoints += pts;
    factors.push({
      factor: `Brief Stay (${los} days)`,
      points: pts,
      category: 'Length of Stay',
      description: 'Rapid 1-2 day turnaround; lower in-hospital deconditioning risk.',
    });
  }

  // 6. Post-Discharge Protective Interventions (What-If Simulation)
  if (rawPatient.scheduledFollowup7Days) {
    const pts = -14;
    totalPoints += pts;
    factors.push({
      factor: 'Confirmed 7-Day Outpatient Follow-up',
      points: pts,
      category: 'Intervention',
      description: 'Scheduled early physician consultation actively intercepts acute relapses and prevents readmission.',
    });
  }

  if (rawPatient.medicationAdherencePlan) {
    const pts = -11;
    totalPoints += pts;
    factors.push({
      factor: 'Structured Medication Adherence Plan',
      points: pts,
      category: 'Intervention',
      description: 'Dedicated pharmacist counseling, prescription reconciliation, and calendar blister pack reduce dosing errors.',
    });
  }

  // Total possible raw points = 25 + 25 + 25 + 20 + 15 = 110
  // Normalize to 0 - 100 scale (bounded between 5 and 100)
  const normalizedScore = Math.min(100, Math.max(5, Math.round((Math.max(0, totalPoints) / 110) * 100)));

  let riskLevel: RiskLevel = 'Low';
  if (normalizedScore >= 65) {
    riskLevel = 'High';
  } else if (normalizedScore >= 35) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  // Sort factors by impact (highest points first)
  factors.sort((a, b) => b.points - a.points);

  return {
    riskScore: normalizedScore,
    riskLevel,
    contributingFactors: factors,
  };
}

function getField(raw: any, possibleKeys: string[], defaultValue: any = ''): any {
  for (const k of possibleKeys) {
    if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== '') {
      return raw[k];
    }
  }
  const rawKeys = Object.keys(raw);
  for (const k of possibleKeys) {
    const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = rawKeys.find(rk => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === normK);
    if (found && raw[found] !== undefined && raw[found] !== null && String(raw[found]).trim() !== '') {
      return raw[found];
    }
  }
  return defaultValue;
}

export function enhancePatientRecord(raw: any, index: number): PatientRecord {
  const id = getField(raw, ['id', 'ID', 'PatientID', 'Patient ID', 'patient_id', 'PID', 'pid'], `PID-${String(index + 1).padStart(5, '0')}`);
  const name = getField(raw, ['name', 'Name', 'patient_name', 'Patient Name', 'Full Name'], `Patient #${index + 1}`);
  const age = parseInt(getField(raw, ['age', 'Age', 'patient_age', 'Patient Age'], 45), 10) || 45;
  const gender = getField(raw, ['gender', 'Gender', 'Sex', 'sex'], 'Unspecified');
  const bloodType = getField(raw, ['bloodType', 'Blood Type', 'blood_type', 'BloodType'], 'O+');
  const medicalCondition = getField(raw, ['medicalCondition', 'Medical Condition', 'medical_condition', 'Condition', 'Diagnosis'], 'General Care');
  const dateOfAdmission = getField(raw, ['dateOfAdmission', 'Date of Admission', 'date_of_admission', 'Admission Date', 'admission_date'], new Date().toISOString().split('T')[0]);
  const dischargeDate = getField(raw, ['dischargeDate', 'Discharge Date', 'discharge_date', 'Discharge'], '');
  const doctor = getField(raw, ['doctor', 'Doctor', 'Physician', 'Attending Physician', 'physician'], 'Staff Physician');
  const hospital = getField(raw, ['hospital', 'Hospital', 'Facility', 'Medical Center'], 'Central Regional Medical Center');
  const insuranceProvider = getField(raw, ['insuranceProvider', 'Insurance Provider', 'insurance_provider', 'Insurance', 'Payer'], 'Standard Health');
  const billingAmount = parseFloat(getField(raw, ['billingAmount', 'Billing Amount', 'billing_amount', 'Billing', 'Cost', 'Charge'], 12500)) || 12500;
  const roomNumber = getField(raw, ['roomNumber', 'Room Number', 'room_number', 'Room'], (100 + (index % 400)));
  const admissionType = getField(raw, ['admissionType', 'Admission Type', 'admission_type', 'AdmissionType'], 'Elective');
  const medication = getField(raw, ['medication', 'Medication', 'medications', 'Drug', 'Rx'], 'Standard Care');
  const testResults = getField(raw, ['testResults', 'Test Results', 'test_results', 'TestResults', 'Lab Results'], 'Normal');

  const lengthOfStayDays = calculateLengthOfStay(dateOfAdmission, dischargeDate);

  // Check for any potential target column
  let readmissionTarget: number | null = null;
  const targetKeys = ['readmitted', 'readmission', 'readmitted_30_days', 'target', 'is_readmitted', 'readmission_risk'];
  for (const k of Object.keys(raw)) {
    const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (targetKeys.some(tk => cleanKey.includes(tk))) {
      const val = String(raw[k]).trim().toLowerCase();
      if (val === '1' || val === 'yes' || val === 'true' || val === 'readmitted') {
        readmissionTarget = 1;
        break;
      } else if (val === '0' || val === 'no' || val === 'false' || val === 'not readmitted') {
        readmissionTarget = 0;
        break;
      }
    }
  }

  const computed = computePatientRisk({
    age,
    admissionType,
    testResults,
    medicalCondition,
    lengthOfStayDays,
  });

  const finalRiskScore = raw.riskScore !== undefined && raw.riskScore !== null ? Number(raw.riskScore) : computed.riskScore;
  const finalRiskLevel = raw.riskLevel || computed.riskLevel;
  const finalFactors = (raw.contributingFactors && raw.contributingFactors.length > 0) ? raw.contributingFactors : computed.contributingFactors;

  // Realistic readmission outcome modeling if not explicitly provided
  if (readmissionTarget === null || readmissionTarget === undefined) {
    if (raw.readmissionTarget !== undefined && raw.readmissionTarget !== null) {
      readmissionTarget = raw.readmissionTarget;
    } else {
      // Deterministic pseudo-random seed from index
      const pseudo = (Math.abs(Math.sin(index + 3.14159) * 10000) % 1);
      if (finalRiskScore >= 65) {
        readmissionTarget = pseudo < 0.76 ? 1 : 0; // ~76% high-risk readmissions
      } else if (finalRiskScore >= 40) {
        readmissionTarget = pseudo < 0.32 ? 1 : 0; // ~32% medium-risk readmissions
      } else {
        readmissionTarget = pseudo < 0.05 ? 1 : 0; // ~5% low-risk readmissions
      }
    }
  }

  let readmissionDays: number | undefined = raw.readmissionDays;
  let readmissionDate: string | undefined = raw.readmissionDate;
  let readmissionReason: string | undefined = raw.readmissionReason;
  let readmissionAcuity: 'Emergency' | 'Urgent' | 'Direct Inpatient' | undefined = raw.readmissionAcuity;

  if (readmissionTarget === 1) {
    if (!readmissionDays) {
      readmissionDays = (index * 7 + 11) % 24 + 4; // 4 to 28 days
    }
    if (!readmissionDate && dischargeDate) {
      const dObj = new Date(dischargeDate);
      dObj.setDate(dObj.getDate() + readmissionDays);
      readmissionDate = dObj.toISOString().split('T')[0];
    }
    if (!readmissionAcuity) {
      readmissionAcuity = (index % 3 === 0) ? 'Emergency' : (index % 3 === 1) ? 'Urgent' : 'Direct Inpatient';
    }
    if (!readmissionReason) {
      const reasonsMap: Record<string, string[]> = {
        Diabetes: [
          'Acute Hyperglycemic Crisis / Ketoacidosis flare',
          'Post-discharge Diabetic Foot Ulcer Infection',
          'Severe Hypoglycemia secondary to medication titration',
          'Uncontrolled Glycemic Spikes with acute electrolyte imbalance',
        ],
        Hypertension: [
          'Hypertensive Urgency with secondary acute chest discomfort',
          'Acute Cardiorenal Syndrome & Severe Volume Overload',
          'Hypertensive Encephalopathy post-discharge non-compliance',
          'Refractory Blood Pressure surge with acute dizziness',
        ],
        Asthma: [
          'Acute Severe Bronchospasm refractory to outpatient inhaler',
          'Viral Upper Respiratory Infection triggering Asthmatic Attack',
          'Hypoxemic Respiratory Distress & Steroid-Resistant Flare',
          'Allergen-Induced Acute Airway Obstruction',
        ],
        Arthritis: [
          'Severe Polyarticular Flare with acute functional immobility',
          'Septic Arthritis suspicion with joint effusion and fever',
          'NSAID-Induced Gastric Irritation & Acute Pain Crisis',
          'Systemic Inflammatory Surge requiring inpatient steroid therapy',
        ],
        Cancer: [
          'Post-Chemotherapy Febrile Neutropenia & Inpatient Sepsis Workup',
          'Severe Intractable Nausea, Dehydration & Electrolyte Depletion',
          'Malignant Pleural Effusion / Acute Respiratory Distress',
          'Venous Thromboembolism & Deep Vein Thrombosis',
        ],
        Obesity: [
          'Acute Obstructive Sleep Apnea-Hypoventilation Crisis',
          'Post-discharge Deep Soft Tissue Infection / Cellulitis',
          'Acute Venous Insufficiency & Severe Lower Extremity Edema',
          'Metabolic Syndrome Exacerbation with Acute Dyspnea',
        ],
      };
      const reasons = reasonsMap[medicalCondition] || [
        'Acute Clinical Decompensation post-discharge',
        'Secondary Bacterial Infection requiring IV Antibiotics',
        'Adverse Drug Event & Treatment Non-Adherence',
      ];
      readmissionReason = reasons[index % reasons.length];
    }
  }

  return {
    id,
    name,
    age,
    gender,
    bloodType,
    medicalCondition,
    dateOfAdmission,
    dischargeDate,
    doctor,
    hospital,
    insuranceProvider,
    billingAmount,
    roomNumber,
    admissionType,
    medication,
    testResults,
    lengthOfStayDays,
    riskScore: finalRiskScore,
    riskLevel: finalRiskLevel,
    contributingFactors: finalFactors,
    readmissionTarget,
    readmissionDays,
    readmissionDate,
    readmissionReason,
    readmissionAcuity,
    clinicalNotes: raw.clinicalNotes,
    dischargeReport: raw.dischargeReport,
  };
}
