import React, { useState } from 'react';
import { LogIn, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { AuthService, UserProfile } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { getPortalSwitchUrl } from '../../utils/subdomain';
import { HospitalOnboarding } from './HospitalOnboarding';
import prosethLogo from '../../assets/ProsethBot.png';

interface HospitalPartnerAuthProps {
  onSuccess: (user: UserProfile) => void;
  onSwitchToPatient?: () => void;
}

export const HospitalPartnerAuth: React.FC<HospitalPartnerAuthProps> = ({
  onSuccess,
  onSwitchToPatient,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [view, setView] = useState<'login' | 'register' | 'onboarding'>('login');
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<UserProfile | null>(null);

  // Login Form States & Inline Errors
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{
    account?: string;
    password?: string;
    general?: string;
    suggestRegister?: boolean;
  }>({});

  // Clean Registration States
  const [adminFullName, setAdminFullName] = useState('');
  const [officialContact, setOfficialContact] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerErrors, setRegisterErrors] = useState<{ [key: string]: string }>({});

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle Staff / Hospital Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { account?: string; password?: string; general?: string } = {};

    if (!loginAccount.trim()) {
      errors.account = t('partner_login_account_label') + ' is required.';
    }
    if (!loginPassword || loginPassword.length < 6) {
      errors.password = t('err_admin_password');
    }

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    setLoginErrors({});
    setLoading(true);

    try {
      const res = await AuthService.login(loginAccount.trim(), loginPassword);

      if (res.user.role === 'PATIENT') {
        AuthService.clearSession();
        setLoginErrors({
          general: isKm
            ? 'គណនីនេះជាគណនីអ្នកជំងឺ មិនមែនបុគ្គលិកមន្ទីរពេទ្យ ឬគ្លីនិកទេ។ សូមចុច "ត្រឡប់ក្រោយ" ដើម្បីចូលប្រើប្រាស់ជាអ្នកជំងឺ។'
            : 'This is a patient account, not hospital or clinic staff. Please click "Back" to access the patient portal.',
          suggestRegister: false,
        });
        setLoading(false);
        return;
      }

      onSuccess(res.user);
    } catch (err: any) {
      const raw = err.message || '';
      if (
        raw.includes('401') ||
        raw.includes('Incorrect') ||
        raw.includes('not found') ||
        raw.includes('credentials')
      ) {
        setLoginErrors({ general: t('err_partner_auth_failed') });
      } else if (raw.includes('Failed to fetch') || raw.includes('Network')) {
        setLoginErrors({ general: t('err_partner_network') });
      } else {
        setLoginErrors({ general: t('err_partner_auth_failed') });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Clean Registration -> Transition to Onboarding
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!adminFullName.trim()) {
      errors.adminFullName = t('err_admin_name');
    }
    if (!officialContact.trim()) {
      errors.officialContact = t('err_facility_contact');
    }
    if (!registerPassword || registerPassword.length < 6) {
      errors.password = t('err_admin_password');
    }
    if (registerPassword !== confirmPassword) {
      errors.confirmPassword = t('err_password_mismatch');
    }

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    setRegisterErrors({});
    setLoading(true);

    try {
      const res = await AuthService.registerPartner({
        admin_full_name: adminFullName.trim(),
        contact_identifier: officialContact.trim(),
        password: registerPassword,
      });

      // Registration successful -> immediately display the Onboarding flow!
      setRegisteredUser(res.user);
      setView('onboarding');
    } catch (err: any) {
      const raw = err.message || '';
      if (raw.includes('409') || raw.includes('already exists') || raw.includes('already registered')) {
        setRegisterErrors({ general: t('err_partner_exists') });
      } else if (raw.includes('Failed to fetch') || raw.includes('Network')) {
        setRegisterErrors({ general: t('err_partner_network') });
      } else {
        setRegisterErrors({ general: raw || t('err_partner_network') });
      }
    } finally {
      setLoading(false);
    }
  };

  const [isClosing, setIsClosing] = useState(false);

  const handlePatientSwitch = () => {
    if (onSwitchToPatient) {
      onSwitchToPatient();
    } else {
      window.location.href = getPortalSwitchUrl('patient');
    }
  };

  const handleBack = () => {
    if (view === 'register') {
      setView('login');
      setLoginErrors({});
      setRegisterErrors({});
    } else {
      if (isClosing) return;
      setIsClosing(true);
      setTimeout(() => {
        handlePatientSwitch();
      }, 220);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        fontFamily: kmFont,
      }}
    >
      {/* Top Header Bar - only shown during onboarding */}
      {view === 'onboarding' && (
        <header
          style={{
            width: '100%',
            height: '64px',
            backgroundColor: 'var(--bg-primary, #ffffff)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={prosethLogo}
              alt="Proseth Healthcare AI"
              style={{
                height: '36px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  lineHeight: 1.2,
                }}
              >
                {t('app_title')}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                }}
              >
                {t('nav_partner_console')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LanguageSwitcher />
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem 1rem',
          boxSizing: 'border-box',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {view === 'onboarding' && (registeredUser || AuthService.getStoredUser()) ? (
          <HospitalOnboarding
            currentUser={registeredUser || AuthService.getStoredUser()!}
            onComplete={(user) => {
              const target = user || registeredUser || AuthService.getStoredUser();
              if (target) {
                onSuccess(target);
              }
            }}
          />
        ) : (
          <div
            className={`responsive-modal-card ${isClosing ? 'modal-closing' : ''}`}
            style={{
              width: '100%',
              maxWidth: 'min(440px, 92vw)',
              maxHeight: 'min(640px, calc(100vh - 3rem))',
              backgroundColor: 'var(--bg-primary, #ffffff)',
              border: '1px solid rgba(24, 83, 57, 0.2)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(12, 47, 39, 0.25)',
              overflow: 'hidden',
              boxSizing: 'border-box',
              transition: 'max-width 0.2s ease',
            }}
          >
            {/* Top Navigation: Back Button and Language Switcher in same row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.65rem 0.5rem 1.65rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 0',
                  fontFamily: kmFont,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateX(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <ArrowLeft size={17} />
                <span>{isKm ? 'ត្រឡប់ក្រោយ' : 'Back'}</span>
              </button>

              <LanguageSwitcher />
            </div>

            {/* Scrollable Form Body inside Modal */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.25rem 1.65rem 1.65rem 1.65rem',
              }}
            >

            {/* Header Title with Proseth Mascot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.35rem' }}>
              <div style={{ marginBottom: '0.65rem' }}>
                <img 
                  src={prosethLogo} 
                  alt="Proseth Healthcare AI" 
                  style={{ 
                    height: '52px', 
                    width: 'auto', 
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 3px 8px rgba(24, 83, 57, 0.16))',
                    display: 'block',
                    margin: '0 auto',
                  }} 
                />
              </div>

              <h1
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  margin: 0,
                  lineHeight: 1.3,
                  fontFamily: kmFont,
                }}
              >
                {view === 'login' ? t('partner_portal_title') : t('partner_tab_register')}
              </h1>
            </div>

            {/* VIEW 1: HOSPITAL SIGN IN */}
            {view === 'login' && (
              <form key="partner-login-form" className="modal-form-enter" onSubmit={handleLoginSubmit}>
                {/* Account Input */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '5px',
                    }}
                  >
                    {t('partner_login_account_label')}
                  </label>
                  <input
                    type="text"
                    value={loginAccount}
                    onChange={(e) => {
                      setLoginAccount(e.target.value);
                      if (loginErrors.account || loginErrors.general) {
                        setLoginErrors({});
                      }
                    }}
                    placeholder={t('partner_login_account_placeholder')}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.15rem',
                      border: `1px solid ${
                        loginErrors.account ? '#dc2626' : 'var(--border-color)'
                      }`,
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                      background: 'var(--bg-primary, #ffffff)',
                      boxSizing: 'border-box',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  />
                  {loginErrors.account && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.82rem',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {loginErrors.account}
                    </span>
                  )}
                </div>

                {/* Password Input */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '5px',
                    }}
                  >
                    {t('partner_login_password_label')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginErrors.password || loginErrors.general) {
                          setLoginErrors({});
                        }
                      }}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.85rem 0.75rem 1.15rem',
                        border: `1px solid ${
                          loginErrors.password ? '#dc2626' : 'var(--border-color)'
                        }`,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)',
                        background: 'var(--bg-primary, #ffffff)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '12px',
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
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.82rem',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {loginErrors.password}
                    </span>
                  )}
                </div>

                {/* General Login Error */}
                {loginErrors.general && (
                  <div
                    style={{
                      color: '#dc2626',
                      fontSize: '0.88rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {loginErrors.general}
                  </div>
                )}

                {/* Suggest Register Button */}
                {loginErrors.suggestRegister && (
                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialContact(loginAccount.trim());
                        setView('register');
                        setLoginErrors({});
                        setRegisterErrors({});
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1.15rem',
                        background: 'linear-gradient(135deg, #185339 0%, #1e6d4c 45%, #2a8150 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.94rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(24, 83, 57, 0.24)',
                        fontFamily: kmFont,
                      }}
                    >
                      {isKm
                        ? 'ចុះឈ្មោះមន្ទីរពេទ្យ / គ្លីនិកជាមួយគណនីនេះ'
                        : 'Register Hospital / Clinic with this account'}
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.78rem 1.15rem',
                    background: 'linear-gradient(135deg, #0c2f27 0%, #185339 50%, #227349 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    boxShadow: '0 4px 14px rgba(12, 47, 39, 0.22)',
                    transition: 'all 0.2s ease',
                    fontFamily: kmFont,
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
                  <LogIn size={18} />
                  <span>{loading ? t('chat_processing') : t('partner_login_btn')}</span>
                </button>

                {/* Secondary Action: Switch to Register */}
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {isKm
                      ? 'មិនទាន់មានមន្ទីរពេទ្យ ឬគ្លីនិកក្នុងប្រព័ន្ធ?'
                      : "Don't have a registered hospital or clinic?"}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setView('register');
                      setLoginErrors({});
                      setRegisterErrors({});
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.15rem',
                      background: 'transparent',
                      border: '1.5px solid #185339',
                      borderRadius: 'var(--radius-full)',
                      color: '#185339',
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      transition: 'all 0.2s ease',
                      fontFamily: kmFont,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(24, 83, 57, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {t('partner_tab_register')}
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 2: REGISTER HOSPITAL ADMIN */}
            {view === 'register' && (
              <form key="partner-register-form" className="modal-form-enter" onSubmit={handleRegisterSubmit}>
                {/* Admin Full Name */}
                <div style={{ marginBottom: '0.95rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '5px',
                    }}
                  >
                    {t('admin_name_label')}
                  </label>
                  <input
                    type="text"
                    value={adminFullName}
                    onChange={(e) => {
                      setAdminFullName(e.target.value);
                      if (registerErrors.adminFullName) {
                        setRegisterErrors((p) => ({ ...p, adminFullName: '' }));
                      }
                    }}
                    placeholder="e.g. Dr. Dararith"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.15rem',
                      border: `1px solid ${
                        registerErrors.adminFullName ? '#dc2626' : 'var(--border-color)'
                      }`,
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                      background: 'var(--bg-primary, #ffffff)',
                      boxSizing: 'border-box',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  />
                  {registerErrors.adminFullName && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.82rem',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {registerErrors.adminFullName}
                    </span>
                  )}
                </div>

                {/* Official Email or Phone */}
                <div style={{ marginBottom: '0.95rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '5px',
                    }}
                  >
                    {t('facility_contact_label')}
                  </label>
                  <input
                    type="text"
                    value={officialContact}
                    onChange={(e) => {
                      setOfficialContact(e.target.value);
                      if (registerErrors.officialContact) {
                        setRegisterErrors((p) => ({ ...p, officialContact: '' }));
                      }
                    }}
                    placeholder={t('facility_contact_placeholder')}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.15rem',
                      border: `1px solid ${
                        registerErrors.officialContact ? '#dc2626' : 'var(--border-color)'
                      }`,
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                      background: 'var(--bg-primary, #ffffff)',
                      boxSizing: 'border-box',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  />
                  {registerErrors.officialContact && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.82rem',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {registerErrors.officialContact}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div style={{ marginBottom: '0.95rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '5px',
                    }}
                  >
                    {t('partner_login_password_label')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                        if (registerErrors.password) {
                          setRegisterErrors((p) => ({ ...p, password: '' }));
                        }
                      }}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.85rem 0.75rem 1.15rem',
                        border: `1px solid ${
                          registerErrors.password ? '#dc2626' : 'var(--border-color)'
                        }`,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)',
                        background: 'var(--bg-primary, #ffffff)',
                        boxSizing: 'border-box',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((prev: boolean) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '12px',
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
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {registerErrors.password && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.82rem',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {registerErrors.password}
                    </span>
                  )}
                </div>

                {/* Retype Password */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '5px',
                    }}
                  >
                    {t('partner_retype_password_label')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (registerErrors.confirmPassword) {
                          setRegisterErrors((p) => ({ ...p, confirmPassword: '' }));
                        }
                      }}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.85rem 0.75rem 1.15rem',
                        border: `1px solid ${
                          registerErrors.confirmPassword ? '#dc2626' : 'var(--border-color)'
                        }`,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)',
                        background: 'var(--bg-primary, #ffffff)',
                        boxSizing: 'border-box',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev: boolean) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '12px',
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
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {registerErrors.confirmPassword && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.82rem',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      {registerErrors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* General Register Error */}
                {registerErrors.general && (
                  <div
                    style={{
                      color: '#dc2626',
                      fontSize: '0.88rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {registerErrors.general}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.78rem 1.15rem',
                    background: 'linear-gradient(135deg, #185339 0%, #1e6d4c 45%, #2a8150 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    boxShadow: '0 4px 16px rgba(24, 83, 57, 0.24)',
                    transition: 'all 0.2s ease',
                    fontFamily: kmFont,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #12432e 0%, #17573d 45%, #226f44 100%)';
                      e.currentTarget.style.transform = 'translateY(-1.5px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(24, 83, 57, 0.32)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #185339 0%, #1e6d4c 45%, #2a8150 100%)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(24, 83, 57, 0.24)';
                    }
                  }}
                >
                  <span>{loading ? t('chat_processing') : t('partner_register_btn')}</span>
                  <ArrowRight size={18} />
                </button>

                {/* Secondary Action: Back to Sign In */}
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {isKm
                      ? 'មានគណនីមន្ទីរពេទ្យរួចហើយ?'
                      : 'Already have a registered hospital account?'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setLoginErrors({});
                      setRegisterErrors({});
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.15rem',
                      background: 'transparent',
                      border: '1.5px solid #185339',
                      borderRadius: 'var(--radius-full)',
                      color: '#185339',
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      transition: 'all 0.2s ease',
                      fontFamily: kmFont,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(24, 83, 57, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {t('sign_in')}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
