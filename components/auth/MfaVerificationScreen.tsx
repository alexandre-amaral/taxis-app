import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import {
  MultiFactorResolver,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from 'firebase/auth';

interface MfaVerificationScreenProps {
  resolver: MultiFactorResolver;
  onMfaVerified: () => void;
}

const MfaVerificationScreen: React.FC<MfaVerificationScreenProps> = ({ resolver, onMfaVerified }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [verificationId, setVerificationId] = useState('');

  useEffect(() => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-signin', {
        'size': 'invisible',
        'callback': () => {},
      });
      verifier.render();
      setRecaptchaVerifier(verifier);
    }
  }, [recaptchaVerifier]);

  useEffect(() => {
    const sendVerificationCode = async () => {
      if (!recaptchaVerifier) return;

      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session,
      };
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      try {
        const id = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
        setVerificationId(id);
        setError(null);
      } catch (error: any) {
        setError(error.message);
      }
    };

    sendVerificationCode();
  }, [resolver, recaptchaVerifier]);

  const handleVerifyMfa = async () => {
    if (!verificationCode) return;

    setIsVerifying(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await resolver.resolveSignIn(credential);
      onMfaVerified();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
            2-Factor Authentication
          </h1>
          <p className="text-gray-400 mt-2">Enter the code sent to your phone</p>
        </div>

        <div
          className="bg-gray-800 rounded-lg p-8 border border-cyan-500/20 space-y-6"
          style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.12)' }}
        >
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
            <p className="text-sm text-gray-300">A verification code was sent to your phone</p>
            <p className="text-xs text-gray-400 mt-1">Enter it below to continue</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Verification Code
            </label>
            <input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-4 py-2 text-white bg-gray-700 border rounded-md focus:outline-none transition-all text-center text-lg tracking-widest"
              style={{
                borderColor: 'rgba(0, 255, 255, 0.2)',
                boxShadow: '0 0 6px rgba(0, 255, 255, 0.04)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 255, 255, 0.4)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 255, 255, 0.2)';
                e.target.style.boxShadow = '0 0 6px rgba(0, 255, 255, 0.04)';
              }}
              maxLength={6}
              autoFocus
            />
          </div>

          <button
            onClick={handleVerifyMfa}
            disabled={isVerifying || !verificationCode}
            className="w-full px-4 py-3 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 0 12px rgba(0, 255, 255, 0.3)' }}
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-center text-red-400">{error}</p>
            </div>
          )}
          <div id="recaptcha-container-signin"></div>
        </div>
      </div>
    </div>
  );
};

export default MfaVerificationScreen;
