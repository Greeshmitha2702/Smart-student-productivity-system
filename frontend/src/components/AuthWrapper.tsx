import React, { useEffect, useState } from 'react';
import { Auth } from 'aws-amplify';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password.');
      return;
    }

    try {
      if (mode === 'signUp') {
        await Auth.signUp({
          username: email.trim(),
          password,
          attributes: { email: email.trim() }
        });
      }

      await Auth.signIn(email.trim(), password);
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
      setAuthenticated(true);
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
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            style={{ padding: '0.75rem 1rem' }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{ padding: '0.75rem 1rem' }}
          />

          {error && <div style={{ color: '#b42318' }}>{error}</div>}

          <button onClick={handleAuth} style={{ padding: '0.75rem 1rem' }}>
            {mode === 'signIn' ? 'Login' : 'Create Account'}
          </button>

          <button
            onClick={() => {
              setError(null);
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            }}
            style={{ padding: '0.75rem 1rem', background: 'transparent', border: '1px solid #d0d7de' }}
          >
            {mode === 'signIn' ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthWrapper;
