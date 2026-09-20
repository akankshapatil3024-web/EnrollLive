import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClinicalIntervention, PatientRecord, UserProfile, AuditLogEntry, ClinicianRole } from '../types';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore using provisioned database ID
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db: Firestore = getFirestore(app, databaseId);

export const googleProvider = new GoogleAuthProvider();

// ==========================================
// 👤 Clinician User Profiles & Auth Handlers
// ==========================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching clinician profile from Firestore:', error);
    return null;
  }
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, user, { merge: true });
  } catch (error) {
    console.error('Error saving clinician profile to Firestore:', error);
    throw error;
  }
}

export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  
  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    profile = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || 'Doctor',
      accountType: 'doctor',
      role: 'physician',
      department: 'General Internal Medicine',
      photoURL: fbUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await saveUserProfile(profile);
  } else {
    await saveUserProfile({
      ...profile,
      accountType: profile.accountType || 'doctor',
      lastLoginAt: new Date().toISOString(),
    });
  }
  return profile;
}

export async function signInClinicianEmail(email: string, pass: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = result.user;
  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    profile = {
      uid: fbUser.uid,
      email: fbUser.email || email,
      displayName: fbUser.displayName || email.split('@')[0],
      accountType: 'doctor',
      role: 'physician',
      department: 'Clinical Care Unit',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await saveUserProfile(profile);
  }
  return profile;
}

export async function registerClinicianEmail(
  email: string,
  pass: string,
  displayName: string,
  role: ClinicianRole = 'physician',
  department = 'Inpatient Chronic Disease Care'
): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = result.user;
  
  await updateProfile(fbUser, { displayName });

  const profile: UserProfile = {
    uid: fbUser.uid,
    email,
    displayName,
    accountType: 'doctor',
    role,
    department,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  await saveUserProfile(profile);
  return profile;
}

export async function signInAsDemoClinician(
  preset: 'dr_rao' | 'nurse_patil' | 'dr_vance'
): Promise<UserProfile> {
  // Use anonymous auth or mock login session with valid uid
  const result = await signInAnonymously(auth);
  const fbUser = result.user;

  const presets: Record<string, { name: string; role: ClinicianRole; dept: string; email: string }> = {
    dr_rao: {
      name: 'Dr. Sarah Rao, MD',
      role: 'physician',
      dept: 'Cardiology & Heart Failure Service',
      email: 's.rao@enrolllive-hospital.org',
    },
    nurse_patil: {
      name: 'Maya Patil, RN, BSN',
      role: 'nurse',
      dept: 'Post-Acute Transitional Care',
      email: 'm.patil@enrolllive-hospital.org',
    },
    dr_vance: {
      name: 'Dr. Marcus Vance, MD, FACP',
      role: 'administrator',
      dept: 'Clinical Quality & Readmissions Taskforce',
      email: 'm.vance@enrolllive-hospital.org',
    },
  };

  const selected = presets[preset];
  await updateProfile(fbUser, { displayName: selected.name });

  const profile: UserProfile = {
    uid: fbUser.uid,
    email: selected.email,
    displayName: selected.name,
    accountType: 'doctor',
    role: selected.role,
    department: selected.dept,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  await saveUserProfile(profile);
  return profile;
}

// ==========================================
// 🧑‍⚕️ Patient Account & Portal Handlers
// ==========================================

export async function signInPatientEmail(
  emailOrPatientId: string,
  pass: string,
  linkedPatientId?: string,
  patientName?: string
): Promise<UserProfile> {
  let profile: UserProfile;
  try {
    const isEmail = emailOrPatientId.includes('@');
    const authEmail = isEmail ? emailOrPatientId : `${emailOrPatientId.toLowerCase().replace(/[^a-z0-9]/g, '')}@patient.enrolllive.local`;
    
    const result = await signInWithEmailAndPassword(auth, authEmail, pass);
    const fbUser = result.user;
    const existing = await getUserProfile(fbUser.uid);
    if (existing) {
      profile = {
        ...existing,
        accountType: 'patient',
        patientId: linkedPatientId || existing.patientId,
        lastLoginAt: new Date().toISOString(),
      };
    } else {
      profile = {
        uid: fbUser.uid,
        email: authEmail,
        displayName: patientName || emailOrPatientId,
        accountType: 'patient',
        role: 'patient',
        patientId: linkedPatientId || emailOrPatientId,
        department: 'Patient Health Portal',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    // If user signs in with Patient ID directly, authenticate anonymously and link
    const result = await signInAnonymously(auth);
    const fbUser = result.user;
    profile = {
      uid: fbUser.uid,
      email: `${emailOrPatientId.toLowerCase()}@patient.enrolllive.local`,
      displayName: patientName || emailOrPatientId,
      accountType: 'patient',
      role: 'patient',
      patientId: linkedPatientId || emailOrPatientId,
      department: 'Patient Health Portal',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }

  await saveUserProfile(profile);
  return profile;
}

export async function registerPatientAccount(params: {
  displayName: string;
  email: string;
  password?: string;
  patientId: string;
}): Promise<UserProfile> {
  const { displayName, email, password = 'PatientSecurePass123!', patientId } = params;
  let uid = '';
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    uid = result.user.uid;
    await updateProfile(result.user, { displayName });
  } catch (err) {
    const result = await signInAnonymously(auth);
    uid = result.user.uid;
    await updateProfile(result.user, { displayName });
  }

  const profile: UserProfile = {
    uid,
    email,
    displayName,
    accountType: 'patient',
    role: 'patient',
    patientId,
    department: 'Personal Health Portal',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  await saveUserProfile(profile);
  return profile;
}

export async function signInAsDemoPatient(
  preset: 'margaret' | 'robert' | 'james'
): Promise<UserProfile> {
  const result = await signInAnonymously(auth);
  const fbUser = result.user;

  const demoPatients: Record<string, { name: string; patientId: string; email: string }> = {
    margaret: {
      name: 'Margaret Sullivan',
      patientId: 'PID-00001',
      email: 'm.sullivan@patient.enrolllive.org',
    },
    robert: {
      name: 'Robert Martinez',
      patientId: 'PID-00002',
      email: 'r.martinez@patient.enrolllive.org',
    },
    james: {
      name: 'James Wilson',
      patientId: 'PID-00003',
      email: 'j.wilson@patient.enrolllive.org',
    },
  };

  const selected = demoPatients[preset];
  await updateProfile(fbUser, { displayName: selected.name });

  const profile: UserProfile = {
    uid: fbUser.uid,
    email: selected.email,
    displayName: selected.name,
    accountType: 'patient',
    role: 'patient',
    patientId: selected.patientId,
    department: 'Personal Patient Health Record',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  await saveUserProfile(profile);
  return profile;
}

export async function logOutClinician(): Promise<void> {
  await firebaseSignOut(auth);
}

// ==========================================
// 🏥 Cloud Firestore: Patient Sync & Storage
// ==========================================

export async function syncPatientToFirestore(patient: PatientRecord): Promise<void> {
  try {
    const patientDocRef = doc(db, 'patients', patient.id);
    await setDoc(
      patientDocRef,
      {
        ...patient,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error syncing patient to Cloud Firestore:', error);
    throw error;
  }
}

export async function fetchFirestorePatients(): Promise<PatientRecord[]> {
  try {
    const q = query(collection(db, 'patients'), limit(500));
    const snapshot = await getDocs(q);
    const patients: PatientRecord[] = [];
    snapshot.forEach((d) => {
      patients.push(d.data() as PatientRecord);
    });
    return patients;
  } catch (error) {
    console.warn('Unable to query patients from Firestore:', error);
    return [];
  }
}

// ==========================================
// 📋 Clinical Interventions & Prevention Plans
// ==========================================

export async function createClinicalIntervention(
  intervention: Omit<ClinicalIntervention, 'id' | 'createdAt'>
): Promise<ClinicalIntervention> {
  try {
    const colRef = collection(db, 'interventions');
    const docData = {
      ...intervention,
      createdAt: new Date().toISOString(),
    };
    const newDoc = await addDoc(colRef, docData);
    const created: ClinicalIntervention = {
      id: newDoc.id,
      ...docData,
    };
    return created;
  } catch (error) {
    console.error('Error creating clinical intervention in Firestore:', error);
    throw error;
  }
}

export async function getPatientInterventions(patientId: string): Promise<ClinicalIntervention[]> {
  try {
    const q = query(
      collection(db, 'interventions'),
      where('patientId', '==', patientId)
    );
    const snap = await getDocs(q);
    const list: ClinicalIntervention[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) });
    });
    // sort locally by createdAt desc
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    console.warn('Error getting interventions from Firestore:', error);
    return [];
  }
}

export const fetchPatientInterventions = getPatientInterventions;

export async function updateInterventionStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<void> {
  try {
    const docRef = doc(db, 'interventions', id);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating intervention status in Firestore:', error);
    throw error;
  }
}

export function subscribePatientInterventions(
  patientId: string,
  callback: (interventions: ClinicalIntervention[]) => void
): () => void {
  const q = query(
    collection(db, 'interventions'),
    where('patientId', '==', patientId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: ClinicalIntervention[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      console.warn('Snapshot listener error on interventions:', err);
    }
  );
}

// ==========================================
// 🛡️ Clinical Audit Logs & Compliance Trail
// ==========================================

export async function logClinicalAuditAction(
  action: string,
  userId: string,
  userName: string,
  details: string,
  patientId?: string
): Promise<void> {
  try {
    const colRef = collection(db, 'auditLogs');
    await addDoc(colRef, {
      action,
      userId,
      userName,
      details,
      patientId: patientId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Error recording audit log in Firestore:', error);
  }
}

export async function getRecentAuditLogs(limitCount = 20): Promise<AuditLogEntry[]> {
  try {
    const q = query(collection(db, 'auditLogs'), limit(limitCount));
    const snap = await getDocs(q);
    const logs: AuditLogEntry[] = [];
    snap.forEach((d) => {
      logs.push({ id: d.id, ...(d.data() as any) });
    });
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs;
  } catch (error) {
    console.warn('Error fetching audit logs:', error);
    return [];
  }
}

export { app };
