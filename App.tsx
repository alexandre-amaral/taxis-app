import React, { useState, useEffect } from 'react';
import { AuthState, User, UserPreferences } from './types';
import AuthScreen from './components/auth/AuthScreen';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import Layout from './components/core/Layout';
import Feed from './components/core/Feed';
import LoadingSpinner from './components/core/LoadingSpinner';
import { auth, db, GoogleAuthProvider } from './firebaseConfig';
import { onAuthStateChanged, signInAnonymously, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { generateCode, storeAuthCode, verifyAuthCode } from './services/authCodeService';
import { sendCodeEmail } from './services/emailService';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOADING);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
            if (firebaseUser) {
                console.log('User authenticated:', firebaseUser.uid);
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    console.log('[Auth] User doc exists, loading data...');
                    const docData = userDoc.data();
                    console.log('[Auth] Raw Firestore data:', docData);
                    console.log('[Auth] Preferences field:', docData.preferences);
                    console.log('[Auth] Preferences type:', typeof docData.preferences);
                    console.log('[Auth] Preferences keys:', docData.preferences ? Object.keys(docData.preferences) : 'N/A');

                    const userData: User = {
                        id: docData.id || firebaseUser.uid,
                        email: docData.email || firebaseUser.email,
                        name: docData.name || firebaseUser.displayName,
                        preferences: docData.preferences || null
                    };

                    console.log('[Auth] User object created:', {
                        id: userData.id,
                        email: userData.email,
                        name: userData.name,
                        hasPreferences: !!userData.preferences,
                        preferencesIsObject: typeof userData.preferences === 'object',
                        preferencesKeys: userData.preferences ? Object.keys(userData.preferences) : []
                    });

                    setUser(userData);

                    // Check if preferences exist and have required fields
                    const hasValidPreferences = userData.preferences &&
                        (userData.preferences.sources || userData.preferences.categoryInterests || userData.preferences.interests);

                    if (hasValidPreferences) {
                        console.log('[Auth] ✅ User has VALID preferences, going to SIGNED_IN state');
                        setAuthState(AuthState.SIGNED_IN);
                    } else {
                        console.log('[Auth] ⚠️ User has NO preferences or invalid preferences, going to ONBOARDING state');
                        console.log('[Auth] Preferences:', userData.preferences);
                        setAuthState(AuthState.ONBOARDING);
                    }
                } else {
                    // Document doesn't exist yet
                    console.log('[Auth] User doc does not exist yet');

                    // Check if this is Anonymous Auth (from email login flow)
                    const isAnonymous = firebaseUser.isAnonymous;
                    console.log('[Auth] Is anonymous auth:', isAnonymous);

                    if (isAnonymous) {
                        // Don't create document yet - let the login flow handle it
                        // The login code will copy preferences or create new user
                        console.log('[Auth] ⏳ Anonymous auth detected, waiting for login flow to create user document...');

                        // Wait a moment and try again (login flow should have created it by then)
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const retryDoc = await getDoc(userDocRef);

                        if (retryDoc.exists()) {
                            console.log('[Auth] ✅ User document created by login flow, reprocessing...');
                            const userData = retryDoc.data();
                            const userObj: User = {
                                id: userData.id || firebaseUser.uid,
                                email: userData.email || firebaseUser.email,
                                name: userData.name || firebaseUser.displayName,
                                preferences: userData.preferences || null
                            };
                            setUser(userObj);

                            const hasValidPreferences = userObj.preferences &&
                                (userObj.preferences.sources || userObj.preferences.categoryInterests || userObj.preferences.interests);

                            if (hasValidPreferences) {
                                console.log('[Auth] ✅ User has VALID preferences, going to SIGNED_IN state');
                                setAuthState(AuthState.SIGNED_IN);
                            } else {
                                console.log('[Auth] ⚠️ User has NO preferences, going to ONBOARDING state');
                                setAuthState(AuthState.ONBOARDING);
                            }
                        } else {
                            console.log('[Auth] ⚠️ Document still does not exist, creating placeholder...');
                            // Create placeholder - login flow failed?
                            const newUser: User = {
                                id: firebaseUser.uid,
                                email: firebaseUser.email,
                                name: firebaseUser.displayName,
                                preferences: null,
                            };
                            await setDoc(userDocRef, newUser);
                            setUser(newUser);
                            setAuthState(AuthState.ONBOARDING);
                        }
                    } else {
                        // Google Sign-In or other non-anonymous auth
                        console.log('[Auth] Creating new user doc (non-anonymous)...');
                        const newUser: User = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: firebaseUser.displayName,
                            preferences: null,
                        };
                        await setDoc(userDocRef, newUser);
                        console.log('[Auth] New user doc created');
                        setUser(newUser);
                        setAuthState(AuthState.ONBOARDING);
                    }
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
      setError(e.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Request login code
  const requestLoginCode = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const code = generateCode();
      await storeAuthCode(email, code);
      await sendCodeEmail(email, code);
      setPendingEmail(email);
    } catch (err: any) {
      console.error('Error requesting login code:', err);
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
      const isValid = await verifyAuthCode(pendingEmail, code);

      if (!isValid) {
        setError('Invalid or expired code. Please try again.');
        return;
      }

      console.log('[Login] ✅ Code verified, authenticating...');

      // Sign in anonymously FIRST (this always creates a new UID)
      const anonResult = await signInAnonymously(auth);
      const firebaseUser = anonResult.user;
      const currentUid = firebaseUser.uid;

      console.log('[Login] 🔐 Authenticated with UID:', currentUid);

      // NOW we can check if user with this email already exists (by email, not UID)
      const emailDocRef = doc(db, 'usersByEmail', pendingEmail);
      const emailDoc = await getDoc(emailDocRef);

      let existingUid: string | null = null;

      if (emailDoc.exists()) {
        existingUid = emailDoc.data().uid;
        console.log('[Login] 📧 Found existing user by email, old UID:', existingUid);
      } else {
        console.log('[Login] 🆕 No existing user found for this email');
      }

      if (existingUid && existingUid !== currentUid) {
        // User exists - copy preferences from old UID to new UID
        console.log('[Login] 📋 Copying preferences from old UID to new UID...');
        const oldUserRef = doc(db, 'users', existingUid);
        const oldUserDoc = await getDoc(oldUserRef);

        if (oldUserDoc.exists()) {
          const oldUserData = oldUserDoc.data();
          console.log('[Login] ✅ Found old user data:', {
            hasPreferences: !!oldUserData.preferences,
            hasSources: !!oldUserData.preferences?.sources,
            sourcesCount: oldUserData.preferences?.sources?.length || 0
          });

          // Create new user doc with old preferences
          const newUser: User = {
            id: currentUid,
            email: pendingEmail,
            name: oldUserData.name || null,
            preferences: oldUserData.preferences || null,
          };

          await setDoc(doc(db, 'users', currentUid), newUser);
          console.log('[Login] ✅ User data copied to new UID successfully');

          // Verify the copy worked
          const verifyDoc = await getDoc(doc(db, 'users', currentUid));
          if (verifyDoc.exists()) {
            const verifyData = verifyDoc.data();
            console.log('[Login] 🔍 Verification after copy:', {
              hasPreferences: !!verifyData.preferences,
              hasSources: !!verifyData.preferences?.sources,
              sourcesCount: verifyData.preferences?.sources?.length || 0
            });
          }
        } else {
          console.log('[Login] ⚠️ Old user document not found, creating new user');
          const newUser: User = {
            id: currentUid,
            email: pendingEmail,
            name: null,
            preferences: null,
          };
          await setDoc(doc(db, 'users', currentUid), newUser);
        }
      } else {
        // New user - create fresh document
        console.log('[Login] 🆕 New user (no existing UID), creating fresh document...');
        const newUser: User = {
          id: currentUid,
          email: pendingEmail,
          name: null,
          preferences: null,
        };
        await setDoc(doc(db, 'users', currentUid), newUser);
        console.log('[Login] ✅ New user document created');
      }

      // Update email -> UID mapping for future logins
      await setDoc(emailDocRef, { uid: currentUid, email: pendingEmail });
      console.log('[Login] ✅ Email mapping updated to new UID:', currentUid);

      // Clean up
      setPendingEmail(null);
      console.log('[Login] ✅ Login process completed');

      // Wait a bit to ensure Firestore propagates before onAuthStateChanged reads
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: any) {
      console.error('[Login] ❌ Error during verification:', err);
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
        try {
            console.log('[Onboarding] 📝 Saving preferences for user:', user.id);
            console.log('[Onboarding] Preferences object:', JSON.stringify(preferences, null, 2));

            setIsLoading(true);
            const userDocRef = doc(db, 'users', user.id);

            // Check if document exists before updating
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                console.error('[Onboarding] ❌ User document does not exist! Creating it...');
                // Create the document if it doesn't exist
                await setDoc(userDocRef, {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    preferences: preferences
                });
                console.log('[Onboarding] ✅ User document created with preferences');
            } else {
                console.log('[Onboarding] User document exists, updating preferences...');
                await updateDoc(userDocRef, { preferences });
                console.log('[Onboarding] ✅ Preferences updated successfully');
            }

            // Verify the save by reading it back
            const verifyDoc = await getDoc(userDocRef);
            if (verifyDoc.exists()) {
                const verifyData = verifyDoc.data();
                console.log('[Onboarding] 🔍 Verification - Preferences saved:', verifyData.preferences ? 'YES' : 'NO');
                if (verifyData.preferences) {
                    console.log('[Onboarding] 🔍 Verification - Preferences content:', JSON.stringify(verifyData.preferences).substring(0, 100) + '...');
                }
            }

            const updatedUser = { ...user, preferences };
            setUser(updatedUser);
            setAuthState(AuthState.SIGNED_IN);
            setIsLoading(false);

            console.log('[Onboarding] ✅ User state updated, moving to SIGNED_IN');
        } catch (error) {
            console.error('[Onboarding] ❌ Error saving preferences:', error);
            console.error('[Onboarding] Error details:', error);
            setError('Failed to save preferences. Please try again.');
            setIsLoading(false);
        }
    } else {
        console.error('[Onboarding] ❌ No user found, cannot save preferences');
    }
  };

  const renderContent = () => {
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
                <Layout
                  signOut={signOut}
                  onEditPreferences={() => {
                    console.log('[App] Edit preferences clicked, moving to ONBOARDING');
                    setAuthState(AuthState.ONBOARDING);
                  }}
                >
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