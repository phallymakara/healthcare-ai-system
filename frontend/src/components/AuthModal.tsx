import React, { useState } from 'react';
import { AuthService, UserProfile } from '../services/auth';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { language } = useLanguage();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!account.trim()) {
      setError('Please enter your email or phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.login(account.trim(), password);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      const rawMsg = err.message || '';
      if (rawMsg.includes('401') || rawMsg.includes('Invalid credentials') || rawMsg.includes('Incorrect') || rawMsg.includes('not found')) {
        setError('Incorrect email, phone number, or password. Please try again.');
      } else if (rawMsg.includes('at least 6 characters') || rawMsg.includes('too_short')) {
        setError('Password must be at least 6 characters.');
      } else if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
        setError('Unable to reach the server. Please ensure the backend is running.');
      } else {
        setError(rawMsg || 'Unable to sign in. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await AuthService.registerPatient({
        full_name: fullName,
        phone_number: phone,
        email: email || undefined,
        password: regPassword,
        gender: 'Other',
        blood_type: 'Unknown',
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      const rawMsg = err.message || '';
      if (rawMsg.includes('409') || rawMsg.includes('already exists')) {
        setError('This phone number or email is already registered.');
      } else {
        setError('Unable to complete registration. Please check all fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '460px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        padding: '2rem',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Header Title */}
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
            {tab === 'login' ? (language === 'km' ? 'ចូលប្រើប្រាស់' : 'Sign In') : (language === 'km' ? 'បង្កើតគណនី' : 'Register Account')}
          </h3>
        </div>

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                {language === 'km' ? 'អ៊ីមែល ឬ លេខទូរស័ព្ទ' : 'Email or Phone Number'}
              </label>
              <input
                type="text"
                placeholder={language === 'km' ? 'ឧ. admin@carequeue.ai ឬ 012999001' : 'e.g. admin@carequeue.ai or +85512999001'}
                value={account}
                onChange={(e) => { setAccount(e.target.value); setError(null); }}
                required
                className={error ? 'input-error' : ''}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                {language === 'km' ? 'ពាក្យសម្ងាត់' : 'Password'}
              </label>
              <input
                type="password"
                placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់' : 'Enter password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                required
                className={error ? 'input-error' : ''}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
              {/* Inline Error at field location */}
              {error && <span className="error-text">{error}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}
            >
              {loading
                ? (language === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Authenticating...')
                : (language === 'km' ? 'ចូលប្រើប្រាស់' : 'Sign In')}
            </button>

            {/* Register Patient Action at Bottom */}
            <div style={{ marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(null); }}
                className="btn btn-outline"
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {language === 'km' ? 'បង្កើតគណនី' : 'Register Account'}
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sokreth Vathanak"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+85512888999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Inline Error at form location */}
            {error && <span className="error-text">{error}</span>}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}
            >
              {loading
                ? (language === 'km' ? 'កំពុងបង្កើតគណនី...' : 'Creating Account...')
                : (language === 'km' ? 'បង្កើតគណនី' : 'Register Account')}
            </button>

            {/* Back to Sign In at Bottom */}
            <div style={{ marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null); }}
                className="btn btn-outline"
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {language === 'km' ? 'មានគណនីរួចហើយ? ចូលប្រើប្រាស់' : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
