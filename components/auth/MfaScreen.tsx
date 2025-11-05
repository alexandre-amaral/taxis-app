import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  User,
} from 'firebase/auth';

interface MfaScreenProps {
  user: User;
  onMfaEnrolled: () => void;
}

const MfaScreen: React.FC<MfaScreenProps> = ({ user, onMfaEnrolled }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });
      verifier.render();
      setRecaptchaVerifier(verifier);
    }
  }, [recaptchaVerifier]);

  const handleSendVerificationCode = async () => {
    if (!recaptchaVerifier) return;

    try {
      const session = await multiFactor(user).getSession();
      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: session,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const id = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
      setVerificationId(id);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEnrollMfa = async () => {
    if (!verificationId || !verificationCode) return;

    setIsEnrolling(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);

      await multiFactor(user).enroll(multiFactorAssertion, 'My Phone');
      onMfaEnrolled();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
            2-Factor Authentication
          </h1>
          <p className="text-gray-400 mt-2">Add an extra layer of security to your account</p>
        </div>

        <div
          className="bg-gray-800 rounded-lg p-8 border border-cyan-500/20 space-y-6"
          style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.12)' }}
        >
          {!verificationId ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+15551234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 text-white bg-gray-700 border rounded-md focus:outline-none transition-all"
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
                />
                <p className="text-xs text-gray-400">Include country code (e.g., +1 for US)</p>
              </div>
              <button
                onClick={handleSendVerificationCode}
                className="w-full px-4 py-3 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition duration-300"
                style={{ boxShadow: '0 0 12px rgba(0, 255, 255, 0.3)' }}
              >
                Send Verification Code
              </button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                <p className="text-sm text-gray-300">Verification code sent to</p>
                <p className="text-white font-semibold mt-1">{phoneNumber}</p>
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
                />
              </div>
              <button
                onClick={handleEnrollMfa}
                disabled={isEnrolling}
                className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-50"
                style={{ boxShadow: '0 0 12px rgba(0, 255, 136, 0.3)' }}
              >
                {isEnrolling ? 'Enrolling...' : 'Verify & Enable 2FA'}
              </button>
            </>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-center text-red-400">{error}</p>
            </div>
          )}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    </div>
  );
};

export default MfaScreen;
