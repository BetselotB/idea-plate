// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  checkActionCode,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, limit, serverTimestamp, DocumentData, doc, setDoc, getDoc } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Create user document in Firestore if it doesn't exist
export const createUserInFirestore = async (user: User, name?: string) => {
  if (!user?.uid) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: name || user.displayName || "",
      createdAt: new Date(),
      // Add more fields as needed
    });
  }
};

// Authentication functions
export const signUpWithEmail = async (email: string, password: string, name?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name in Firebase Auth
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    // Send email verification
    await sendEmailVerification(userCredential.user);
    // Create user in Firestore with name
    await createUserInFirestore(userCredential.user, name);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Ensure user exists in Firestore
    await createUserInFirestore(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Create user in Firestore if not exists
    await createUserInFirestore(result.user);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// Email verification functions
export const sendVerificationEmail = async (user: User) => {
  try {
    console.log('Sending verification email to:', user.email);
    await sendEmailVerification(user);
    console.log('Verification email sent successfully');
    return { error: null };
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return { error: error.message };
  }
};

export const sendPasswordReset = async (email: string) => {
  try {
    console.log('Sending password reset email to:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully');
    return { error: null };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { error: error.message };
  }
};

// Handle email verification from URL
export const handleEmailVerification = async (actionCode: string) => {
  try {
    await applyActionCode(auth, actionCode);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Check if action code is valid
export const checkEmailVerificationCode = async (actionCode: string) => {
  try {
    const info = await checkActionCode(auth, actionCode);
    return { info, error: null };
  } catch (error: any) {
    return { info: null, error: error.message };
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { app, analytics }; 