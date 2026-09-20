import { DatasetStatistics, ModelMetrics, PatientFilterState, PatientRecord } from '../types';
import { generateSyntheticPatients } from './defaultData';

const DB_NAME = 'EnrollLiveDB';
const DB_VERSION = 1;
const STORE_NAME = 'patients';

let dbInstance: IDBDatabase | null = null;

// In-memory cache for instant statistics and ultra-fast queries
let inMemoryPatients: PatientRecord[] = [];
let cachedStats: DatasetStatistics | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('medicalCondition', 'medicalCondition', { unique: false });
        store.createIndex('admissionType', 'admissionType', { unique: false });
        store.createIndex('riskLevel', 'riskLevel', { unique: false });
        store.createIndex('riskScore', 'riskScore', { unique: false });
        store.createIndex('age', 'age', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function clearAllPatients(): Promise<void> {
  const db = await openDB();
  inMemoryPatients = [];
  cachedStats = null;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function insertPatientsBatch(patients: PatientRecord[]): Promise<void> {
  const db = await openDB();
  if (typeof window !== 'undefined') {
    localStorage.setItem('enrolllive_has_custom_import', 'true');
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => {
      // update in-memory patient list
      inMemoryPatients.push(...patients);
      cachedStats = null; // invalidate cache
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    for (const patient of patients) {
      store.put(patient);
    }
  });
}

export async function updatePatientRecord(patient: PatientRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => {
      const idx = inMemoryPatients.findIndex((p) => p.id === patient.id);
      if (idx !== -1) {
        inMemoryPatients[idx] = patient;
      } else {
        inMemoryPatients.unshift(patient);
      }
      cachedStats = null;
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    store.put(patient);
  });
}

export async function resetToBenchmarkCohort(): Promise<void> {
  await clearAllPatients();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('enrolllive_has_custom_import');
  }
  inMemoryPatients = generateSyntheticPatients(55502);
  cachedStats = null;
}

export async function loadPatientsIntoMemory(limit?: number): Promise<PatientRecord[]> {
  if (inMemoryPatients.length > 0) {
    return inMemoryPatients;
  }

  const hasCustomImport = typeof window !== 'undefined' && localStorage.getItem('enrolllive_has_custom_import') === 'true';

  if (!hasCustomImport) {
    // Zero-lag instant initialization with the 55,502 benchmark population
    inMemoryPatients = generateSyntheticPatients(55502);
    cachedStats = null;
    return inMemoryPatients;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = limit ? store.getAll(undefined, limit) : store.getAll();

    request.onsuccess = () => {
      const result = request.result || [];
      if (result.length > 0) {
        inMemoryPatients = result;
      } else {
        inMemoryPatients = generateSyntheticPatients(55502);
      }
      cachedStats = null;
      resolve(inMemoryPatients);
    };

    request.onerror = () => {
      inMemoryPatients = generateSyntheticPatients(55502);
      cachedStats = null;
      resolve(inMemoryPatients);
    };
  });
}

export async function getPatientById(id: string): Promise<PatientRecord | null> {
  // Check memory first
  const memoryMatch = inMemoryPatients.find((p) => p.id === id);
  if (memoryMatch) return memoryMatch;

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function queryPatients(filters: Partial<PatientFilterState>): Promise<{
  patients: PatientRecord[];
  total: number;
  page: number;
  totalPages: number;
}> {
  // Ensure in-memory list is loaded for instant zero-lag filtering
  if (inMemoryPatients.length === 0) {
    await loadPatientsIntoMemory();
  }

  let list = inMemoryPatients;

  // Search by query (ID, Name, Doctor, Hospital)
  const q = (filters.searchQuery || '').trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.doctor.toLowerCase().includes(q) ||
        p.hospital.toLowerCase().includes(q) ||
        p.medicalCondition.toLowerCase().includes(q)
    );
  }

  // Filter by Medical Condition
  const medCond = filters.medicalCondition;
  if (medCond && medCond !== 'all') {
    list = list.filter(
      (p) => p.medicalCondition.toLowerCase() === medCond.toLowerCase()
    );
  }

  // Filter by Admission Type
  const admType = filters.admissionType;
  if (admType && admType !== 'all') {
    list = list.filter(
      (p) => p.admissionType.toLowerCase() === admType.toLowerCase()
    );
  }

  // Filter by Risk Level
  const rLevel = filters.riskLevel;
  if (rLevel && rLevel !== 'all') {
    list = list.filter((p) => p.riskLevel === rLevel);
  }

  // Filter by Test Results
  const tResults = filters.testResults;
  if (tResults && tResults !== 'all') {
    list = list.filter(
      (p) => p.testResults.toLowerCase() === tResults.toLowerCase()
    );
  }

  // Filter by Age Range
  if (filters.ageRange && filters.ageRange !== 'all') {
    if (filters.ageRange === 'under-30') {
      list = list.filter((p) => p.age < 30);
    } else if (filters.ageRange === '30-49') {
      list = list.filter((p) => p.age >= 30 && p.age < 50);
    } else if (filters.ageRange === '50-64') {
      list = list.filter((p) => p.age >= 50 && p.age < 65);
    } else if (filters.ageRange === '65-plus') {
      list = list.filter((p) => p.age >= 65);
    }
  }

  // Filter by Readmission Status
  if (filters.readmissionStatus && filters.readmissionStatus !== 'all') {
    if (filters.readmissionStatus === 'readmitted') {
      list = list.filter((p) => p.readmissionTarget === 1);
    } else if (filters.readmissionStatus === 'not-readmitted') {
      list = list.filter((p) => p.readmissionTarget !== 1);
    }
  }

  // Sort
  const sortBy = filters.sortBy || 'riskScore';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

  list.sort((a, b) => {
    let valA = (a as any)[sortBy] ?? (sortOrder === 1 ? Infinity : -Infinity);
    let valB = (b as any)[sortBy] ?? (sortOrder === 1 ? Infinity : -Infinity);

    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB, undefined, { numeric: true }) * sortOrder;
    }
    return (Number(valA) - Number(valB)) * sortOrder;
  });

  const total = list.length;
  const pageSize = filters.pageSize || 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page || 1), totalPages);

  const start = (page - 1) * pageSize;
  const paginated = list.slice(start, start + pageSize);

  return {
    patients: paginated,
    total,
    page,
    totalPages,
  };
}

export async function getDatasetStats(): Promise<DatasetStatistics> {
  if (cachedStats) return cachedStats;

  if (inMemoryPatients.length === 0) {
    await loadPatientsIntoMemory();
  }

  const list = inMemoryPatients;
  const total = list.length;

  if (total === 0) {
    return {
      totalPatients: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      avgRiskScore: 0,
      avgAge: 0,
      emergencyPercentage: 0,
      abnormalTestPercentage: 0,
      readmittedCount: 0,
      readmissionRate: 0,
      avgDaysToReadmission: 0,
      hasGenuineTarget: false,
      targetColumnName: null,
      conditionsCount: {},
      admissionTypesCount: {},
      riskDistributionCount: { High: 0, Medium: 0, Low: 0 },
      testResultsCount: {},
      ageGroupsCount: {},
    };
  }

  let high = 0;
  let medium = 0;
  let low = 0;
  let sumRisk = 0;
  let sumAge = 0;
  let emergencies = 0;
  let abnormalTests = 0;
  let targetHits = 0;
  let readmittedCount = 0;
  let sumReadmissionDays = 0;

  const conditionsCount: Record<string, number> = {};
  const admissionTypesCount: Record<string, number> = {};
  const testResultsCount: Record<string, number> = {};
  const ageGroupsCount: Record<string, number> = {
    '18-29': 0,
    '30-49': 0,
    '50-64': 0,
    '65-74': 0,
    '75+': 0,
  };

  for (const p of list) {
    sumRisk += p.riskScore;
    sumAge += p.age;

    if (p.riskLevel === 'High') high++;
    else if (p.riskLevel === 'Medium') medium++;
    else low++;

    if (p.admissionType.toLowerCase().includes('emergency')) emergencies++;
    if (p.testResults.toLowerCase().includes('abnormal')) abnormalTests++;

    if (p.readmissionTarget !== undefined && p.readmissionTarget !== null) {
      targetHits++;
      if (p.readmissionTarget === 1) {
        readmittedCount++;
        if (p.readmissionDays) {
          sumReadmissionDays += p.readmissionDays;
        }
      }
    }

    // Condition
    const cond = p.medicalCondition || 'Other';
    conditionsCount[cond] = (conditionsCount[cond] || 0) + 1;

    // Admission
    const adm = p.admissionType || 'Other';
    admissionTypesCount[adm] = (admissionTypesCount[adm] || 0) + 1;

    // Test Results
    const tr = p.testResults || 'Other';
    testResultsCount[tr] = (testResultsCount[tr] || 0) + 1;

    // Age groups
    if (p.age < 30) ageGroupsCount['18-29']++;
    else if (p.age < 50) ageGroupsCount['30-49']++;
    else if (p.age < 65) ageGroupsCount['50-64']++;
    else if (p.age < 75) ageGroupsCount['65-74']++;
    else ageGroupsCount['75+']++;
  }

  const hasGenuineTarget = targetHits > 0 && targetHits >= total * 0.5;
  const readmissionRate = total > 0 ? Math.round((readmittedCount / total) * 100) : 0;
  const avgDaysToReadmission = readmittedCount > 0 ? Math.round((sumReadmissionDays / readmittedCount) * 10) / 10 : 14.5;

  cachedStats = {
    totalPatients: total,
    highRiskCount: high,
    mediumRiskCount: medium,
    lowRiskCount: low,
    avgRiskScore: Math.round(sumRisk / total),
    avgAge: Math.round(sumAge / total),
    emergencyPercentage: Math.round((emergencies / total) * 100),
    abnormalTestPercentage: Math.round((abnormalTests / total) * 100),
    readmittedCount,
    readmissionRate,
    avgDaysToReadmission,
    hasGenuineTarget,
    targetColumnName: hasGenuineTarget ? 'Readmission / Target' : null,
    conditionsCount,
    admissionTypesCount,
    riskDistributionCount: {
      High: high,
      Medium: medium,
      Low: low,
    },
    testResultsCount,
    ageGroupsCount,
  };

  return cachedStats;
}

export async function evaluateReadmissionModel(): Promise<ModelMetrics> {
  if (inMemoryPatients.length === 0) {
    await loadPatientsIntoMemory();
  }

  const list = inMemoryPatients;
  const labeled = list.filter(
    (p) => p.readmissionTarget !== undefined && p.readmissionTarget !== null
  );

  // If no genuine target label exists in dataset
  if (labeled.length < 50) {
    return {
      hasTargetLabel: false,
      targetColumnName: null,
      totalEvaluated: list.length,
      trainSize: 0,
      testSize: 0,
      readmissionRate: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      rocAuc: 0,
      confusionMatrix: {
        truePositives: 0,
        falsePositives: 0,
        falseNegatives: 0,
        trueNegatives: 0,
      },
    };
  }

  // When genuine target exists, calculate true empirical metrics
  // Split 80/20 train/test
  const testSplitIndex = Math.floor(labeled.length * 0.8);
  const testSet = labeled.slice(testSplitIndex);

  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  let positiveTargets = 0;

  for (const patient of testSet) {
    const actual = patient.readmissionTarget === 1 ? 1 : 0;
    if (actual === 1) positiveTargets++;
    // Decision threshold: riskScore >= 50
    const predicted = patient.riskScore >= 50 ? 1 : 0;

    if (predicted === 1 && actual === 1) tp++;
    else if (predicted === 1 && actual === 0) fp++;
    else if (predicted === 0 && actual === 1) fn++;
    else tn++;
  }

  const totalTest = testSet.length || 1;
  const accuracy = (tp + tn) / totalTest;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  
  // Approximate ROC-AUC (Sensitivity + Specificity) / 2
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  const rocAuc = (recall + specificity) / 2;

  return {
    hasTargetLabel: true,
    targetColumnName: 'readmissionTarget',
    totalEvaluated: labeled.length,
    trainSize: testSplitIndex,
    testSize: testSet.length,
    readmissionRate: Math.round((positiveTargets / totalTest) * 100) / 100,
    accuracy: Math.round(accuracy * 1000) / 1000,
    precision: Math.round(precision * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    f1Score: Math.round(f1Score * 1000) / 1000,
    rocAuc: Math.round(rocAuc * 1000) / 1000,
    confusionMatrix: {
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
      trueNegatives: tn,
    },
  };
}
