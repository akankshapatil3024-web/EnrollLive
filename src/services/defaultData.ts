import { enhancePatientRecord } from './riskEngine';
import { PatientRecord } from '../types';

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
];

const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Cancer', 'Obesity'];
const ADMISSION_TYPES = ['Emergency', 'Urgent', 'Elective'];
const TEST_RESULTS = ['Normal', 'Abnormal', 'Inconclusive'];
const MEDICATIONS = ['Aspirin', 'Ibuprofen', 'Penicillin', 'Paracetamol', 'Lipitor'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const HOSPITALS = [
  'St. Jude Memorial Hospital',
  'Mercy General Medical Center',
  'Presbyterian Healthcare Pavilion',
  'Valley Regional Health System',
  'Cityview University Hospital',
  'Northwestern Community Clinic',
  'Cedars-Sinai Regional Wing',
  'Memorial Hermann Health Center'
];
const DOCTORS = [
  'Dr. Sarah Chen, MD',
  'Dr. Marcus Vance, MD',
  'Dr. Elena Rostova, MD',
  'Dr. Samuel Okonjo, MD',
  'Dr. Rachel Goldstein, MD',
  'Dr. David Al-Mansoor, MD',
  'Dr. Chloe Kensington, DO',
  'Dr. Gregory House, MD',
  'Dr. Priya Patel, MD'
];
const INSURANCES = ['Medicare', 'Blue Cross', 'Aetna', 'Cigna', 'UnitedHealthcare'];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateSyntheticPatients(count = 55502, startIndex = 0): PatientRecord[] {
  const records: PatientRecord[] = [];
  const baseYear = 2024;

  const TARGET_HIGH = 8420;
  const TARGET_MED = 12340;
  const TARGET_LOW = count - TARGET_HIGH - TARGET_MED; // 34,742 when count is 55,502

  let highCount = 0;
  let medCount = 0;
  let lowCount = 0;

  for (let i = 0; i < count; i++) {
    const globalIndex = startIndex + i;
    const seed = globalIndex + 42;
    const r1 = pseudoRandom(seed);
    const r2 = pseudoRandom(seed + 1);
    const r3 = pseudoRandom(seed + 2);
    const r4 = pseudoRandom(seed + 3);
    const r5 = pseudoRandom(seed + 4);
    const r6 = pseudoRandom(seed + 5);
    const r7 = pseudoRandom(seed + 6);
    const r8 = pseudoRandom(seed + 7);
    const r9 = pseudoRandom(seed + 8);
    const r10 = pseudoRandom(seed + 9);

    let id = `P${String(globalIndex + 1).padStart(3, '0')}`;
    let name: string;
    let age: number;
    let gender: string = r4 > 0.49 ? 'Female' : 'Male';
    let bloodType: string = BLOOD_TYPES[Math.floor(r5 * BLOOD_TYPES.length)];
    let medicalCondition: string;
    let admissionType: string;
    let testResults: string;
    let medication: string;
    let losDays: number;
    let riskScore: number;
    let riskLevel: 'High' | 'Medium' | 'Low';

    if (globalIndex === 0) {
      // P001 | 65 | Diabetes | HIGH (Matches user wireframe)
      id = 'P001';
      name = 'Eleanor Vance';
      age = 65;
      gender = 'Female';
      medicalCondition = 'Diabetes';
      admissionType = 'Emergency';
      testResults = 'Abnormal';
      medication = 'Lipitor';
      losDays = 7;
      riskScore = 78;
      riskLevel = 'High';
    } else if (globalIndex === 1) {
      // P002 | 42 | Arthritis | LOW (Matches user wireframe)
      id = 'P002';
      name = 'Marcus Miller';
      age = 42;
      gender = 'Male';
      medicalCondition = 'Arthritis';
      admissionType = 'Elective';
      testResults = 'Normal';
      medication = 'Ibuprofen';
      losDays = 2;
      riskScore = 18;
      riskLevel = 'Low';
    } else {
      const firstName = FIRST_NAMES[Math.floor(r1 * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(r2 * LAST_NAMES.length)];
      name = `${firstName} ${lastName}`;

      // Allocate tier to hit target population metrics precisely
      const highNeeded = TARGET_HIGH - highCount;
      const medNeeded = TARGET_MED - medCount;
      const lowNeeded = TARGET_LOW - lowCount;

      if (highNeeded > 0 && ((highCount / TARGET_HIGH <= i / count) || (medNeeded <= 0 && lowNeeded <= 0))) {
        riskLevel = 'High';
      } else if (medNeeded > 0 && ((medCount / TARGET_MED <= i / count) || lowNeeded <= 0)) {
        riskLevel = 'Medium';
      } else if (lowNeeded > 0) {
        riskLevel = 'Low';
      } else if (highNeeded > 0) {
        riskLevel = 'High';
      } else {
        riskLevel = 'Medium';
      }

      medicalCondition = CONDITIONS[i % CONDITIONS.length];

      if (riskLevel === 'High') {
        riskScore = 65 + ((i * 7) % 31); // 65-95
        age = 58 + ((i * 3) % 29); // 58-86
        admissionType = (i % 5 === 0) ? 'Urgent' : 'Emergency';
        testResults = (i % 4 === 0) ? 'Inconclusive' : 'Abnormal';
        losDays = 5 + ((i * 3) % 15);
      } else if (riskLevel === 'Medium') {
        riskScore = 35 + ((i * 11) % 30); // 35-64
        age = 40 + ((i * 5) % 34); // 40-73
        admissionType = (i % 2 === 0) ? 'Urgent' : 'Elective';
        testResults = (i % 3 === 0) ? 'Abnormal' : (i % 3 === 1) ? 'Inconclusive' : 'Normal';
        losDays = 3 + ((i * 2) % 8);
      } else {
        riskScore = 8 + ((i * 13) % 27); // 8-34
        age = 19 + ((i * 7) % 44); // 19-62
        admissionType = (i % 6 === 0) ? 'Urgent' : 'Elective';
        testResults = (i % 5 === 0) ? 'Inconclusive' : 'Normal';
        losDays = 1 + ((i * 2) % 4);
      }

      medication = MEDICATIONS[Math.floor(r9 * MEDICATIONS.length)];
    }

    if (riskLevel === 'High') highCount++;
    else if (riskLevel === 'Medium') medCount++;
    else lowCount++;

    const hospital = HOSPITALS[Math.floor(r10 * HOSPITALS.length)];
    const doctor = DOCTORS[Math.floor((r1 + r2) * 0.5 * DOCTORS.length)];
    const insuranceProvider = INSURANCES[Math.floor((r3 + r4) * 0.5 * INSURANCES.length)];
    const roomNumber = 100 + Math.floor(r5 * 450);
    const billingAmount = Math.round(3500 + r6 * 44000);

    // Admission dates across 2024
    const month = 1 + Math.floor(r7 * 11);
    const day = 1 + Math.floor(r8 * 27);
    const dateOfAdmission = `${baseYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dischargeObj = new Date(new Date(dateOfAdmission).getTime() + losDays * 86400000);
    const dischargeDate = dischargeObj.toISOString().split('T')[0];

    const raw = {
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
      lengthOfStayDays: losDays,
      riskScore,
      riskLevel,
    };

    records.push(enhancePatientRecord(raw, globalIndex));
  }

  return records;
}
