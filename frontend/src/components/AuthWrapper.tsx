import React, { useEffect, useState } from 'react';
import { Auth } from 'aws-amplify';
import { recordDailyLogin } from '../api/analytics';
import { startNotificationService } from '../notifications';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'forgotPassword' | 'forgotConfirm' | 'verify'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(async () => {
        setAuthenticated(true);
        await recordDailyLogin();
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password.');
      return;
    }

    if (mode === 'signUp' && password !== confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    try {
      if (mode === 'signUp') {
        await Auth.signUp({
          username: email.trim(),
          password,
          attributes: { email: email.trim() }
        });
        // After sign-up, do not auto sign-in. Show code verification page.
        setMode('verify');
        setPassword('');
        return;
      }

        await Auth.signIn(email.trim(), password);
        // After sign-in, check whether the user's email is verified. If not, prevent access.
        try {
          const current = await Auth.currentAuthenticatedUser();
          const verified = (current?.attributes && (current.attributes.email_verified === true || current.attributes.email_verified === 'true'));
          if (!verified) {
            await Auth.signOut();
            setMode('verify');
            setError('Please verify your email address with the code we sent you.');
            return;
          }
        } catch (checkErr) {
          // If we can't determine verification status, continue but log.
          // eslint-disable-next-line no-console
          console.warn('Could not check email verification status', checkErr);
        }
      // confirm session tokens are available
      try {
        const session = await Auth.currentSession();
        // eslint-disable-next-line no-console
        console.log('Auth session:', {
          idToken: session.getIdToken().getJwtToken().slice(0, 20) + '...',
          accessToken: session.getAccessToken().getJwtToken().slice(0, 20) + '...'
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('No session after sign-in', e);
      }
      await recordDailyLogin();
      setAuthenticated(true);
      try {
        startNotificationService();
      } catch {}
    } catch (err: any) {
      const errorName = err?.code || err?.name || '';
      const errorMessage = String(err?.message || err || '').toLowerCase();

      if (mode === 'signIn' && (errorName === 'UserNotConfirmedException' || errorMessage.includes('user is not confirmed') || errorMessage.includes('not confirmed'))) {
        setMode('verify');
        setPassword('');
        setError('Your account is not verified yet. Enter the code we sent to your email.');
        return;
      }

      setError(err?.message || String(err));
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    try {
      if (!email.trim()) return setError('Enter the email used to sign up to resend verification.');
      await Auth.resendSignUp(email.trim());
      setError('Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  const handleConfirmVerification = async () => {
    setError(null);
    if (!email.trim() || !verificationCode.trim()) {
      setError('Enter the email used to sign up and the verification code.');
      return;
    }

    try {
      await Auth.confirmSignUp(email.trim(), verificationCode.trim());
      setMode('signIn');
      setVerificationCode('');
      setPassword('');
      setError('Email verified successfully. You can now log in.');
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  const handleForgotPasswordRequest = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    try {
      await Auth.forgotPassword(email.trim());
      setMode('forgotConfirm');
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  const handleForgotPasswordConfirm = async () => {
    setError(null);
    if (!email.trim() || !resetCode.trim() || !resetPassword.trim() || !resetConfirmPassword.trim()) {
      setError('Enter email, verification code, new password and confirm password.');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setError('New password and confirm password must match.');
      return;
    }
    try {
      await Auth.forgotPasswordSubmit(email.trim(), resetCode.trim(), resetPassword);
      setMode('signIn');
      setPassword('');
      setResetCode('');
      setResetPassword('');
      setResetConfirmPassword('');
      setError('Password reset successful. Please login with your new password.');
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  const handleSignOut = async () => {
    await Auth.signOut();
    setAuthenticated(false);
    setMode('signIn');
    setPassword('');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (authenticated) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem 0' }}>
          <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem' }}>
            Sign Out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '2rem', border: '1px solid #d0d7de', borderRadius: 16, background: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>Student Productivity System</h2>
        {mode === 'verify' ? (
          <div style={{ display: 'grid', gap: 12, textAlign: 'center' }}>
            <p style={{ marginTop: 0, fontWeight: 600 }}>Thank you for signing up</p>
            <p>We sent a verification code to your inbox. Enter that code here to activate your account.</p>
            <p>If you don't see the code, check your spam folder or click resend below.</p>
            <input
              type="text"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              placeholder="Verification code"
              style={{ padding: '0.75rem 1rem' }}
            />
            {error && <div style={{ color: '#b42318' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              <button type="button" onClick={handleConfirmVerification} style={{ padding: '0.75rem 1rem' }}>Verify code</button>
              <button type="button" onClick={() => setMode('signIn')} style={{ padding: '0.75rem 1rem' }}>Back to login</button>
              <button type="button" onClick={handleResendVerification} style={{ padding: '0.75rem 1rem', background: 'transparent', border: '1px solid #d0d7de' }}>Resend verification</button>
            </div>
          </div>
        ) : (
        <form onSubmit={e => { e.preventDefault(); handleAuth(); }} style={{ display: 'grid', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            style={{ padding: '0.75rem 1rem' }}
          />
          {(mode === 'signIn' || mode === 'signUp') && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signUp' ? 'Create password' : 'Password'}
              style={{ padding: '0.75rem 1rem' }}
            />
          )}

          {mode === 'signUp' && (
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              style={{ padding: '0.75rem 1rem' }}
            />
          )}

          {mode === 'forgotConfirm' && (
            <>
              <input
                type="text"
                value={resetCode}
                onChange={e => setResetCode(e.target.value)}
                placeholder="Verification code"
                style={{ padding: '0.75rem 1rem' }}
              />
              <input
                type="password"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                placeholder="New password"
                style={{ padding: '0.75rem 1rem' }}
              />
              <input
                type="password"
                value={resetConfirmPassword}
                onChange={e => setResetConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{ padding: '0.75rem 1rem' }}
              />
            </>
          )}

          {error && <div style={{ color: '#b42318' }}>{error}</div>}

          {mode !== 'forgotPassword' && mode !== 'forgotConfirm' && (
            <button type="submit" style={{ padding: '0.75rem 1rem' }}>
              {mode === 'signIn' ? 'Login' : 'Create Account'}
            </button>
          )}

          {mode === 'forgotPassword' && (
            <button type="button" onClick={handleForgotPasswordRequest} style={{ padding: '0.75rem 1rem' }}>
              Send reset code
            </button>
          )}

          {mode === 'forgotConfirm' && (
            <button type="button" onClick={handleForgotPasswordConfirm} style={{ padding: '0.75rem 1rem' }}>
              Reset password
            </button>
          )}

          {mode !== 'forgotPassword' && mode !== 'forgotConfirm' && (
            <>
              <button
                onClick={() => {
                  setError(null);
                  setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                  if (mode === 'signIn') setVerificationCode('');
                }}
                style={{ padding: '0.75rem 1rem', background: 'transparent', border: '1px solid #d0d7de' }}
              >
                {mode === 'signIn' ? 'Need an account? Sign up' : 'Already have an account? Login'}
              </button>

              {mode === 'signIn' && (
                <button
                  onClick={() => {
                    setError(null);
                    setMode('forgotPassword');
                  }}
                  style={{ padding: '0.75rem 1rem', background: 'transparent', border: '1px solid #d0d7de' }}
                >
                  Forgot password?
                </button>
              )}
            </>
          )}

          {(mode === 'forgotPassword' || mode === 'forgotConfirm') && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('signIn');
              }}
              style={{ padding: '0.75rem 1rem', background: 'transparent', border: '1px solid #d0d7de' }}
            >
              Back to login
            </button>
          )}
        </form>
        )}
      </div>
    </div>
  );
}


export default AuthWrapper;
