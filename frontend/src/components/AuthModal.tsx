import React, { useState } from 'react';
import { AuthService, UserProfile } from '../services/auth';
import { X, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import prosethLogo from '../assets/ProsethBot.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onOpenHospitalPortal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, onOpenHospitalPortal }) => {
  const { language } = useLanguage();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [fullName, setFullName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

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

    if (!fullName.trim()) {
      setError(language === 'km' ? 'សូមបញ្ចូលឈ្មោះពេញ។' : 'Please enter your full name.');
      return;
    }
    if (!phoneOrEmail.trim()) {
      setError(language === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ ឬអ៊ីមែល។' : 'Please enter your phone number or email.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError(language === 'km' ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួអក្សរ។' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const isEmail = phoneOrEmail.includes('@');
      const res = await AuthService.registerPatient({
        full_name: fullName.trim(),
        contact_identifier: phoneOrEmail.trim(),
        phone_number: !isEmail ? phoneOrEmail.trim() : undefined,
        email: isEmail ? phoneOrEmail.trim().toLowerCase() : undefined,
        password: regPassword,
        gender: 'Other',
        blood_type: 'Unknown',
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      const rawMsg = err.message || '';
      if (rawMsg.includes('409') || rawMsg.includes('already exists')) {
        setError(language === 'km' ? 'លេខទូរស័ព្ទ ឬអ៊ីមែលនេះមានរួចហើយ។' : 'This phone number or email is already registered.');
      } else {
        setError(rawMsg || (language === 'km' ? 'មិនអាចបង្កើតគណនីបានទេ។' : 'Unable to complete registration. Please check all fields.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="responsive-modal-overlay" style={{ zIndex: 99999 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="responsive-modal-card" style={{ maxWidth: '540px' }}>
        <div className="responsive-modal-body" style={{ position: 'relative', padding: '2.25rem 2.25rem' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={22} />
        </button>

        {/* Modal Brand Header with Proseth Mascot & Welcome Text */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <img 
              src={prosethLogo} 
              alt="Proseth Healthcare AI" 
              style={{ 
                height: '64px', 
                width: 'auto', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 3px 8px rgba(24, 83, 57, 0.16))',
                display: 'block',
                margin: '0 auto',
              }} 
            />
          </div>

          <h3 style={{ 
            margin: '0 0 0.35rem 0', 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            color: 'var(--text-main)', 
            letterSpacing: '-0.01em',
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' 
          }}>
            {tab === 'login'
              ? (language === 'km' ? 'សូមស្វាគមន៍មកកាន់ប្រព័ន្ធសុខភាព AI' : 'Welcome to Healthcare AI')
              : (language === 'km' ? 'សូមស្វាគមន៍! បង្កើតគណនីថ្មី' : 'Welcome! Create Your Account')}
          </h3>

          <p style={{
            margin: 0,
            fontSize: '0.92rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit'
          }}>
            {tab === 'login'
              ? (language === 'km' 
                  ? 'សូមបញ្ចូលព័ត៌មានគណនីរបស់អ្នកដើម្បីចូលប្រើប្រាស់ និងតាមដានវេនរង់ចាំ' 
                  : 'Sign in to access your appointments and live queue status')
              : (language === 'km' 
                  ? 'ចុះឈ្មោះដើម្បីកក់លេខរង់ចាំ និងពិគ្រោះជាមួយវេជ្ជបណ្ឌិត' 
                  : 'Sign up to reserve queue numbers and track your visits')}
          </p>
        </div>

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                {language === 'km' ? 'អ៊ីមែល ឬ លេខទូរស័ព្ទ' : 'Email or Phone Number'}
              </label>
              <input
                type="text"
                placeholder={language === 'km' ? 'អ៊ីមែល ឬ លេខទូរស័ព្ទ' : 'email or phone'}
                value={account}
                onChange={(e) => { setAccount(e.target.value); setError(null); }}
                required
                className={error ? 'input-error' : ''}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-main)',
                  fontSize: '0.98rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                {language === 'km' ? 'ពាក្យសម្ងាត់' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់' : 'Enter password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  required
                  className={error ? 'input-error' : ''}
                  style={{
                    width: '100%',
                    padding: '0.85rem 3rem 0.85rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-main)',
                    fontSize: '0.98rem',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Inline Error at field location */}
              {error && <span className="error-text" style={{ fontSize: '0.85rem', marginTop: '6px', display: 'block' }}>{error}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.88rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #0c2f27 0%, #185339 50%, #227349 100%)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 4px 14px rgba(12, 47, 39, 0.22)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                transition: 'all 0.2s ease',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #08221b 0%, #13452f 50%, #1d643f 100%)';
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(12, 47, 39, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0c2f27 0%, #185339 50%, #227349 100%)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(12, 47, 39, 0.22)';
                }
              }}
            >
              {loading
                ? (language === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Authenticating...')
                : (language === 'km' ? 'ចូលប្រើប្រាស់' : 'Sign In')}
            </button>

            {/* Register Patient Action at Bottom with Rich Gradient */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.65rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                {language === 'km' ? 'មិនទាន់មានគណនីនៅឡើយទេ?' : "Don't have an account yet?"}
              </div>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(null); }}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-full)',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #185339 0%, #1e6d4c 45%, #2a8150 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 16px rgba(24, 83, 57, 0.24)',
                  transition: 'all 0.2s ease',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #12432e 0%, #17573d 45%, #226f44 100%)';
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(24, 83, 57, 0.32)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #185339 0%, #1e6d4c 45%, #2a8150 100%)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(24, 83, 57, 0.24)';
                }}
              >
                {language === 'km' ? 'បង្កើតគណនី' : 'Register Account'}
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                {language === 'km' ? 'ឈ្មោះពេញ' : 'Full Name'}
              </label>
              <input
                type="text"
                placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះពេញ' : 'Enter full name'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-main)',
                  fontSize: '0.98rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                {language === 'km' ? 'លេខទូរស័ព្ទ ឬ អ៊ីមែល' : 'Phone or Email'}
              </label>
              <input
                type="text"
                placeholder={language === 'km' ? 'ឧ. 012888999 ឬ user@gmail.com' : 'e.g. 012888999 or user@gmail.com'}
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-main)',
                  fontSize: '0.98rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                {language === 'km' ? 'ពាក្យសម្ងាត់' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder={language === 'km' ? 'យ៉ាងតិច 6 តួអក្សរ' : 'Minimum 6 characters'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.85rem 3rem 0.85rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-main)',
                    fontSize: '0.98rem',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Inline Error at form location */}
            {error && <span className="error-text" style={{ fontSize: '0.85rem', marginTop: '6px', display: 'block' }}>{error}</span>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.88rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #0c2f27 0%, #185339 45%, #2a8150 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 4px 16px rgba(24, 83, 57, 0.28)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                transition: 'all 0.2s ease',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #08221b 0%, #13452f 45%, #237045 100%)';
                  e.currentTarget.style.transform = 'translateY(-1.5px)';
                  e.currentTarget.style.boxShadow = '0 6px 22px rgba(24, 83, 57, 0.36)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0c2f27 0%, #185339 45%, #2a8150 100%)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(24, 83, 57, 0.28)';
                }
              }}
            >
              {loading
                ? (language === 'km' ? 'កំពុងបង្កើតគណនី...' : 'Creating Account...')
                : (language === 'km' ? 'បង្កើតគណនី' : 'Register Account')}
            </button>

            {/* Back to Sign In at Bottom */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.65rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
                {language === 'km' ? 'មានគណនីរួចហើយ?' : 'Already have an account?'}
              </div>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null); }}
                style={{
                  width: '100%',
                  padding: '0.8rem 1.15rem',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-full)',
                  color: '#185339',
                  background: 'linear-gradient(135deg, rgba(24, 83, 57, 0.06) 0%, rgba(34, 115, 73, 0.12) 100%)',
                  border: '1.5px solid rgba(24, 83, 57, 0.25)',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(24, 83, 57, 0.12) 0%, rgba(34, 115, 73, 0.18) 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(24, 83, 57, 0.06) 0%, rgba(34, 115, 73, 0.12) 100%)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {language === 'km' ? 'ចូលប្រើប្រាស់' : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        {/* Healthcare Provider Switcher Link */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenHospitalPortal) {
                onOpenHospitalPortal();
              } else {
                window.location.search = '?portal=partner';
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            }}
          >
            {language === 'km'
              ? 'អ្នកផ្តល់សេវាសុខាភិបាល ឬបុគ្គលិកគ្លីនិក? ផ្ទាំងគ្រប់គ្រងមន្ទីរពេទ្យ'
              : 'Healthcare Provider or Staff? Hospital Portal'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
