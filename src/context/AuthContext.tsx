import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  getUserProfile,
  signInWithGoogle,
  signInClinicianEmail,
  registerClinicianEmail,
  signInAsDemoClinician,
  signInPatientEmail,
  registerPatientAccount,
  signInAsDemoPatient,
  logOutClinician,
  saveUserProfile,
  logClinicalAuditAction,
} from '../services/firebase';
import { UserProfile, ClinicianRole, UserAccountType } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role: ClinicianRole,
    department: string
  ) => Promise<void>;
  loginAsDemo: (preset: 'dr_rao' | 'nurse_patil' | 'dr_vance') => Promise<void>;
  loginAsPatient: (
    patientIdOrEmail: string,
    pass?: string,
    linkedPatientId?: string,
    patientName?: string
  ) => Promise<void>;
  registerAsPatient: (params: {
    name: string;
    email: string;
    password?: string;
    patientId: string;
  }) => Promise<void>;
  loginAsDemoPatient: (preset: 'margaret' | 'robert' | 'james') => Promise<void>;
  logout: () => Promise<void>;
  databaseConnected: boolean;
  activeRole: ClinicianRole | 'patient';
  isDoctor: boolean;
  isPatient: boolean;
  patientId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(true);

  // Default fallback guest clinician for instant exploration if not logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          let profile = await getUserProfile(fbUser.uid);
          if (!profile) {
            const defaultProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || 'clinician@hospital.org',
              displayName: fbUser.displayName || 'Attending Physician',
              accountType: 'doctor',
              role: 'physician',
              department: 'Hospital Medicine Service',
              photoURL: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            profile = defaultProfile;
            await saveUserProfile(defaultProfile);
          }
          setCurrentUser(profile);
          setDatabaseConnected(true);
        } catch (err) {
          console.warn('Unable to retrieve user profile from Firestore:', err);
          setDatabaseConnected(false);
        }
      } else {
        // If not logged in with Firebase, automatically set a default clinician session
        // so the user immediately sees clinician access without blocking initial viewing
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      setCurrentUser(profile);
      setIsAuthModalOpen(false);
      await logClinicalAuditAction('LOGIN', profile.uid, profile.displayName, 'Signed in via Google OAuth');
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const profile = await signInClinicianEmail(email, pass);
      setCurrentUser(profile);
      setIsAuthModalOpen(false);
      await logClinicalAuditAction('LOGIN', profile.uid, profile.displayName, 'Signed in via Email/Password');
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: ClinicianRole,
    department: string
  ) => {
    setLoading(true);
    try {
      const profile = await registerClinicianEmail(email, pass, displayName, role, department);
      setCurrentUser(profile);
      setIsAuthModalOpen(false);
      await logClinicalAuditAction('REGISTER', profile.uid, profile.displayName, `Registered as ${role} in ${department}`);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (preset: 'dr_rao' | 'nurse_patil' | 'dr_vance') => {
    setLoading(true);
    try {
      const profile = await signInAsDemoClinician(preset);
      setCurrentUser(profile);
      setIsAuthModalOpen(false);
      await logClinicalAuditAction('DEMO_LOGIN', profile.uid, profile.displayName, `Loaded ${profile.role} demo clinical profile`);
    } finally {
      setLoading(false);
    }
  };

  const loginAsPatient = async (
    patientIdOrEmail: string,
    pass = 'PatientSecurePass123!',
    linkedPatientId?: string,
    patientName?: string
  ) => {
    setLoading(true);
    try {
      const profile = await signInPatientEmail(patientIdOrEmail, pass, linkedPatientId, patientName);
      setCurrentUser(profile);
      setIsAuthModalOpen(false);
      await logClinicalAuditAction('PATIENT_LOGIN', profile.uid, profile.displayName, `Patient accessed personal health records (${profile.patientId})`, profile.patientId);
    } finally {
      setLoading(false);
    }
  };

  const registerAsPatient = async (params: {
    name: string;
    email: string;
    password?: string;
    patientId: string;
  }) => {
    setLoading(true);
    try {
      const profile = await registerPatientAccount({
        displayName: params.name,
        email: params.email,
        password: params.password,
        patientId: params.patientId,
      });
      setCurrentUser(profile);
      setIsAuthModalOpen(false);
      await logClinicalAuditAction('PATIENT_REGISTER', profile.uid, profile.displayName, `Patient enrolled personal health account (${profile.patientId})`, profile.patientId);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoPatient = async (preset: 'margaret' | 'robert' | 'james') => {
    setLoading(true);
    try {
      const profile = await signInAsDemoPatient(preset);
      setCurrentUser(profile);
      setIsAuthModalOpen(false);
      await logClinicalAuditAction('DEMO_PATIENT_LOGIN', profile.uid, profile.displayName, `Loaded patient demo profile for ${profile.displayName} (${profile.patientId})`, profile.patientId);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (currentUser) {
      await logClinicalAuditAction('LOGOUT', currentUser.uid, currentUser.displayName, 'Signed out of session');
    }
    await logOutClinician();
    setCurrentUser(null);
  };

  const isDoctor = !currentUser || currentUser.accountType === 'doctor';
  const isPatient = currentUser?.accountType === 'patient';
  const patientId = currentUser?.patientId || null;
  const activeRole: ClinicianRole | 'patient' = currentUser?.role || 'physician';

  const value = useMemo(
    () => ({
      currentUser,
      firebaseUser,
      loading,
      isAuthModalOpen,
      setIsAuthModalOpen,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      loginAsDemo,
      loginAsPatient,
      registerAsPatient,
      loginAsDemoPatient,
      logout,
      databaseConnected,
      activeRole,
      isDoctor,
      isPatient,
      patientId,
    }),
    [
      currentUser,
      firebaseUser,
      loading,
      isAuthModalOpen,
      databaseConnected,
      activeRole,
      isDoctor,
      isPatient,
      patientId,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
