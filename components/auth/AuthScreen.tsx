import React, { useState } from 'react';

interface AuthScreenProps {
  onSignIn: (email: string) => void;
  onSignUp: (email: string) => void;
  onSignInWithGoogle: () => void;
  onVerifyCode: (code: string) => void;
  pendingEmail: string | null;
  isLoading: boolean;
  error: string | null;
}

type AuthMode = 'signin' | 'signup' | 'passwordless';

const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  onSignUp,
  onSignInWithGoogle,
  onVerifyCode,
  pendingEmail,
  isLoading,
  error
}) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(email);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    onSignUp(email);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    onVerifyCode(code);
  };
  
  const renderForm = () => {
    // Show code verification form if email is pending
    if (pendingEmail) {
      return (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Check your email</h3>
            <p className="text-sm text-gray-300">We've sent a 6-digit code to</p>
            <p className="text-white font-semibold mt-1">{pendingEmail}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Verification Code
            </label>
            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 text-white bg-gray-700 border rounded-md focus:outline-none transition-all text-center text-2xl tracking-widest font-bold"
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
              required
            />
            <p className="text-xs text-gray-400 text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 0 12px rgba(0, 255, 255, 0.3)' }}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={() => {
                setCode('');
                onSignIn(pendingEmail);
              }}
              className="font-medium text-cyan-400 hover:text-cyan-300"
              disabled={isLoading}
            >
              Resend code
            </button>
          </p>
        </form>
      );
    }

    switch(authMode) {
      case 'signin':
        return (
          <form onSubmit={handleSignIn} className="space-y-6">
            <AuthInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-500" style={{ boxShadow: '0 0 12px rgba(0, 255, 255, 0.3)' }}>
              {isLoading ? 'Sending Code...' : 'Send Sign-In Code'}
            </button>
            <p className="text-center text-sm text-gray-400">
              No account?{' '}
              <button type="button" onClick={() => setAuthMode('signup')} className="font-medium text-cyan-400 hover:text-cyan-300">
                Sign up
              </button>
            </p>
          </form>
        );
      case 'signup':
        return (
          <form onSubmit={handleSignUp} className="space-y-6">
            <AuthInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-500" style={{ boxShadow: '0 0 12px rgba(0, 255, 255, 0.3)' }}>
              {isLoading ? 'Sending Code...' : 'Create Account'}
            </button>
            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <button type="button" onClick={() => setAuthMode('signin')} className="font-medium text-cyan-400 hover:text-cyan-300">
                Sign in
              </button>
            </p>
          </form>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
              Taxis
            </h1>
            <p className="text-gray-400 mt-2">Your Personal Intelligence Analyst</p>
        </div>
        <div
          className="bg-gray-800 rounded-lg p-8 border border-cyan-500/20"
          style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.12)' }}
        >
            <h2 className="text-2xl font-bold text-center mb-6 text-cyan-400">
              {pendingEmail ? 'Verify Code' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-center text-sm">{error}</p>
              </div>
            )}
            {renderForm()}
            {!pendingEmail && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-cyan-500/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
                  </div>
                </div>
                <button
                  onClick={onSignInWithGoogle}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition duration-300 disabled:opacity-50"
                  style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)' }}
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.02C43.41 38.61 46.98 32.14 46.98 24.55z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6.02c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    Sign in with Google
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
};

interface AuthInputProps {
    label: string;
    type: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AuthInput: React.FC<AuthInputProps> = ({ label, type, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div>
        <label htmlFor={label} className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
        <input
          id={label}
          name={label}
          type={type}
          required
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : type === 'text' ? 'name' : undefined}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="block w-full appearance-none rounded-md border bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:outline-none sm:text-sm transition-all"
          style={{
            borderColor: isFocused ? 'rgba(0, 255, 255, 0.4)' : 'rgba(0, 255, 255, 0.2)',
            boxShadow: isFocused ? '0 0 10px rgba(0, 255, 255, 0.12)' : '0 0 6px rgba(0, 255, 255, 0.04)'
          }}
        />
    </div>
  );
};


export default AuthScreen;