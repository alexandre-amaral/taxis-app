import { db } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { sendCodeEmail } from './emailService';

export interface AuthCode {
  email: string;
  code: string;
  expiresAt: number;
  createdAt: number;
}

const AUTH_CODES_COLLECTION = 'authCodes';
const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a 6-digit OTP code
 */
export const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store auth code in Firestore
 */
export const storeAuthCode = async (email: string, code: string): Promise<void> => {
  const now = Date.now();
  const authCode: AuthCode = {
    email: email.toLowerCase(),
    code,
    createdAt: now,
    expiresAt: now + CODE_EXPIRY_MS,
  };

  // Use email as document ID (only one active code per email)
  const docRef = doc(db, AUTH_CODES_COLLECTION, email.toLowerCase());

  await setDoc(docRef, authCode);
};

/**
 * Verify auth code
 */
export const verifyAuthCode = async (email: string, code: string): Promise<boolean> => {
  const docRef = doc(db, AUTH_CODES_COLLECTION, email.toLowerCase());
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return false;
  }

  const authCode = docSnap.data() as AuthCode;
  const now = Date.now();

  // Check if code matches and hasn't expired
  if (authCode.code === code && authCode.expiresAt > now) {
    // Delete the code after successful verification (one-time use)
    await deleteDoc(docRef);
    return true;
  }

  // Delete expired code
  if (authCode.expiresAt <= now) {
    await deleteDoc(docRef);
  }

  return false;
};

/**
 * Clean up expired codes (should be called periodically or via Cloud Function)
 */
export const cleanupExpiredCodes = async (): Promise<void> => {
  const now = Date.now();
  const codesRef = collection(db, AUTH_CODES_COLLECTION);
  const q = query(codesRef, where('expiresAt', '<=', now));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};
