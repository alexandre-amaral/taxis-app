import React, { useState, useEffect } from 'react';
import { AuthState, User, UserPreferences } from './types';
import AuthScreen from './components/auth/AuthScreen';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import Layout from './components/core/Layout';
import Feed from './components/core/Feed';
import LoadingSpinner from './components/core/LoadingSpinner';
import { auth, db, GoogleAuthProvider } from './firebaseConfig';
import { onAuthStateChanged, signInAnonymously, EmailAuthProvider, linkWithCredential, signInWithPopup, signOut as firebaseSignOut, getMultiFactorResolver, MultiFactorResolver } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import MfaScreen from './components/auth/MfaScreen';
import MfaVerificationScreen from './components/auth/MfaVerificationScreen';
import { generateCode, storeAuthCode, verifyAuthCode } from './services/authCodeService';
import { sendCodeEmail } from './services/emailService';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOADING);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMfaScreen, setShowMfaScreen] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
            if (firebaseUser) {
                console.log('User authenticated:', firebaseUser.uid);
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    console.log('User doc exists, loading preferences...');
                    const userData = userDoc.data() as User;
                    setUser(userData);
                    if (userData.preferences) {
                        console.log('User has preferences, going to feed');
                        setAuthState(AuthState.SIGNED_IN);
                    } else {
                        console.log('User needs onboarding');
                        setAuthState(AuthState.ONBOARDING);
                    }
                } else {
                    // New user (e.g., via Google Sign-In)
                    console.log('Creating new user doc...');
                    const newUser: User = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName,
                        preferences: null,
                    };
                    await setDoc(userDocRef, newUser);
                    console.log('New user doc created');
                    setUser(newUser);
                    setAuthState(AuthState.ONBOARDING);
                }
            } else {
                console.log('No user authenticated');
                setUser(null);
                setAuthState(AuthState.SIGNED_OUT);
            }
        } catch (error) {
            console.error('ERROR in auth state change:', error);
            setAuthState(AuthState.SIGNED_OUT);
        }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthAction = async (action: Promise<any>) => {
    setIsLoading(true);
    setError(null);
    try {
      await action;
    } catch (e: any) {
      if (e.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, e);
        setMfaResolver(resolver);
      } else {
        setError(e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, ''));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Request login code
  const requestLoginCode = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Requesting login code for:', email);
      const code = generateCode();
      console.log('🎲 Generated code:', code);

      await storeAuthCode(email, code);
      await sendCodeEmail(email, code);

      setPendingEmail(email);

      console.log('✉️ Code sent! Check console for the code.');
    } catch (err: any) {
      console.error('❌ Error requesting login code:', err);
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Verify login code and authenticate
  const verifyLoginCode = async (code: string) => {
    if (!pendingEmail) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Verifying code:', code, 'for email:', pendingEmail);
      const isValid = await verifyAuthCode(pendingEmail, code);

      if (!isValid) {
        console.error('❌ Invalid or expired code');
        setError('Invalid or expired code. Please try again.');
        return;
      }

      console.log('✅ Code verified! Authenticating...');

      // Sign in anonymously first
      const anonResult = await signInAnonymously(auth);
      const firebaseUser = anonResult.user;
      console.log('🔐 Anonymous auth successful:', firebaseUser.uid);

      // Create or update user document
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUser: User = {
          id: firebaseUser.uid,
          email: pendingEmail,
          name: null,
          preferences: null,
        };
        await setDoc(userDocRef, newUser);
        console.log('📝 User document created');
      }

      // Clean up
      setPendingEmail(null);
      console.log('🎉 Login successful!');

    } catch (err: any) {
      console.error('❌ Error during verification:', err);
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = (email: string) => requestLoginCode(email);

  const signUpWithEmail = (email: string) => requestLoginCode(email);
  
  const signInWithGoogle = () => handleAuthAction(
    signInWithPopup(auth, new GoogleAuthProvider())
  );

  const signOut = () => handleAuthAction(firebaseSignOut(auth));

  const handleOnboardingComplete = async (preferences: UserPreferences) => {
    if (user) {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', user.id);
        await updateDoc(userDocRef, { preferences });
        const updatedUser = { ...user, preferences };
        setUser(updatedUser);
        setAuthState(AuthState.SIGNED_IN);
        setIsLoading(false);
    }
  };

  const handleEnableMfa = () => {
    setShowMfaScreen(true);
  };

  const handleMfaEnrolled = () => {
    setShowMfaScreen(false);
  };

  const renderContent = () => {
    if (mfaResolver) {
      return <MfaVerificationScreen resolver={mfaResolver} onMfaVerified={() => setMfaResolver(null)} />
    }

    if (showMfaScreen && auth.currentUser) {
        return <MfaScreen user={auth.currentUser} onMfaEnrolled={handleMfaEnrolled} />;
    }

    switch (authState) {
      case AuthState.LOADING:
        return <LoadingSpinner />;

      case AuthState.SIGNED_OUT:
        return <AuthScreen
          onSignIn={signInWithEmail}
          onSignUp={signUpWithEmail}
          onSignInWithGoogle={signInWithGoogle}
          onVerifyCode={verifyLoginCode}
          pendingEmail={pendingEmail}
          isLoading={isLoading}
          error={error}
        />;
      
      case AuthState.ONBOARDING:
        return <OnboardingWizard onComplete={handleOnboardingComplete} />;

      case AuthState.SIGNED_IN:
        if (user && user.preferences) {
            return (
                <Layout signOut={signOut} onEnableMfa={handleEnableMfa}>
                    <Feed userPreferences={user.preferences} />
                </Layout>
            );
        }
        // This state (SIGNED_IN but no user/prefs) should be transient.
        // The onAuthStateChanged listener will correct the state to ONBOARDING or SIGNED_OUT.
        // Showing a loader is the safest option.
        return <LoadingSpinner />;
        
      default:
        return <LoadingSpinner />;
    }
  };

  return <div className="h-full bg-gray-900">{renderContent()}</div>;
};

export default App;