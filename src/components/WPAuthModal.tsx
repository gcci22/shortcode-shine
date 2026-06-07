import { useState } from 'react';
import { X } from 'lucide-react';
import {
  hasWPForgotPassword,
  hasWPGoogleLogin,
  loginUserWP,
  openLostPasswordWP,
  registerUserWP,
  requestPasswordResetWP,
  signInWithGoogleWP,
} from '@/lib/wp-api';
import { toast } from 'sonner';

interface WPAuthModalProps {
  open: boolean;
  onClose: () => void;
  required?: boolean;
}

export function WPAuthModal({ open, onClose, required = false }: WPAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const googleEnabled = hasWPGoogleLogin();
  const forgotEnabled = hasWPForgotPassword();

  if (!open) return null;

  const resetState = () => {
    setLoading(false);
    setLogin('');
    setEmail('');
    setUsername('');
    setDisplayName('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUserWP({ login, password });
      toast.success('Signed in!');
      resetState();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUserWP({ username, email, password, display_name: displayName });
      toast.success('Account created. Check your email if your WordPress site requires activation.');
      resetState();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogleWP();
      if (googleEnabled) {
        resetState();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await requestPasswordResetWP(login);
      toast.success(result.message || 'Password reset instructions sent');
      if (forgotEnabled) {
        try {
          openLostPasswordWP();
        } catch {}
      }
      setLoading(false);
    } catch (err: any) {
      toast.error(err.message || 'Password reset failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-card/95 border border-border rounded-[22px] p-6 space-y-4 shadow-2xl">
        {!required && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="space-y-1 text-center">
          <div className="text-xl font-extrabold text-primary">VERSACE22 AI</div>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="flex gap-2 p-1 bg-muted rounded-full">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
              mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
              mode === 'register' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="text"
              placeholder="Email or username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || !googleEnabled}
              className="w-full py-2.5 rounded-xl bg-muted text-foreground hover:bg-secondary text-sm font-medium"
            >
              {googleEnabled ? 'Continue with Google' : 'Google sign-in unavailable'}
            </button>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </button>
          </form>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Recover password</h2>
            <input
              type="text"
              placeholder="Email or username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset instructions'}
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Create an account</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              placeholder="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}