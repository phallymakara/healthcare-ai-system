import React, { useState } from 'react';
import { Building2, LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthService, UserProfile } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { getPortalSwitchUrl } from '../../utils/subdomain';
import { HospitalOnboarding } from './HospitalOnboarding';

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
            ? 'គណនីនេះមិនទាន់មានមន្ទីរពេទ្យ ឬគ្លីនិកក្នុងប្រព័ន្ធនៅឡើយទេ។ សូមចុះឈ្មោះមន្ទីរពេទ្យរបស់អ្នកខាងក្រោម។'
            : 'No hospital or clinic is registered under this account yet. Please register your facility below.',
          suggestRegister: true,
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

  const handlePatientSwitch = () => {
    if (onSwitchToPatient) {
      onSwitchToPatient();
    } else {
      window.location.href = getPortalSwitchUrl('patient');
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
      {/* Top Header Bar */}
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
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              background: 'transparent',
            }}
          >
            <Building2 size={20} strokeWidth={1.8} />
          </div>
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

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1rem',
          boxSizing: 'border-box',
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
            style={{
              width: '100%',
              maxWidth: '660px',
              backgroundColor: 'var(--bg-primary, #ffffff)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg, 10px)',
              padding: '3.25rem 3rem',
              boxShadow: 'none',
              boxSizing: 'border-box',
              transition: 'max-width 0.2s ease',
            }}
          >
            {/* Header Title */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h1
                style={{
                  fontSize: '1.95rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '0.75rem',
                  lineHeight: 1.3,
                }}
              >
                {view === 'login' ? t('partner_portal_title') : t('partner_tab_register')}
              </h1>
              <p
                style={{
                  fontSize: '1.12rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {view === 'login'
                  ? t('partner_portal_subtitle')
                  : isKm
                  ? 'បង្កើតគណនីអ្នកគ្រប់គ្រងមន្ទីរពេទ្យ / គ្លីនិករបស់អ្នក'
                  : 'Create your primary facility administrator account'}
              </p>
            </div>

            {/* VIEW 1: HOSPITAL SIGN IN */}
            {view === 'login' && (
              <form onSubmit={handleLoginSubmit}>
                {/* Account Input */}
                <div style={{ marginBottom: '1.65rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '0.6rem',
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
                      padding: '0.95rem 1.15rem',
                      border: `1px solid ${
                        loginErrors.account ? '#dc2626' : 'var(--border-color)'
                      }`,
                      borderRadius: 'var(--radius-md, 8px)',
                      fontSize: '1.08rem',
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
                        fontSize: '0.88rem',
                        marginTop: '6px',
                        display: 'block',
                      }}
                    >
                      {loginErrors.account}
                    </span>
                  )}
                </div>

                {/* Password Input */}
                <div style={{ marginBottom: '1.85rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '0.6rem',
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
                        padding: '0.95rem 2.85rem 0.95rem 1.15rem',
                        border: `1px solid ${
                          loginErrors.password ? '#dc2626' : 'var(--border-color)'
                        }`,
                        borderRadius: 'var(--radius-md, 8px)',
                        fontSize: '1.08rem',
                        color: 'var(--text-main)',
                        background: 'var(--bg-primary, #ffffff)',
                        boxSizing: 'border-box',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev: boolean) => !prev)}
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
                      {showLoginPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.88rem',
                        marginTop: '6px',
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
                      fontSize: '0.92rem',
                      marginBottom: '1.35rem',
                    }}
                  >
                    {loginErrors.general}
                  </div>
                )}

                {/* Suggest Register Button */}
                {loginErrors.suggestRegister && (
                  <div style={{ marginBottom: '1.5rem' }}>
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
                        padding: '0.85rem 1.25rem',
                        background: 'transparent',
                        border: '1px solid var(--accent-primary)',
                        color: 'var(--accent-primary)',
                        borderRadius: 'var(--radius-md, 8px)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: 'none',
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
                    padding: '0.95rem 1.35rem',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '1.12rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  <LogIn size={20} />
                  <span>{loading ? t('chat_processing') : t('partner_login_btn')}</span>
                </button>

                {/* Secondary Action: Switch to Register */}
                <div
                  style={{
                    marginTop: '2rem',
                    paddingTop: '1.75rem',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.05rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.85rem',
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
                      padding: '0.9rem 1.25rem',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md, 8px)',
                      color: 'var(--text-main)',
                      fontSize: '1.06rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      fontFamily: kmFont,
                    }}
                  >
                    {t('partner_tab_register')}
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 2: REGISTER HOSPITAL ADMIN */}
            {view === 'register' && (
              <form onSubmit={handleRegisterSubmit}>
                {/* Admin Full Name */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '0.6rem',
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
                      padding: '0.95rem 1.15rem',
                      border: `1px solid ${
                        registerErrors.adminFullName ? '#dc2626' : 'var(--border-color)'
                      }`,
                      borderRadius: 'var(--radius-md, 8px)',
                      fontSize: '1.08rem',
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
                        fontSize: '0.88rem',
                        marginTop: '6px',
                        display: 'block',
                      }}
                    >
                      {registerErrors.adminFullName}
                    </span>
                  )}
                </div>

                {/* Official Email or Phone */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '0.6rem',
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
                      padding: '0.95rem 1.15rem',
                      border: `1px solid ${
                        registerErrors.officialContact ? '#dc2626' : 'var(--border-color)'
                      }`,
                      borderRadius: 'var(--radius-md, 8px)',
                      fontSize: '1.08rem',
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
                        fontSize: '0.88rem',
                        marginTop: '6px',
                        display: 'block',
                      }}
                    >
                      {registerErrors.officialContact}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '0.6rem',
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
                        padding: '0.95rem 2.85rem 0.95rem 1.15rem',
                        border: `1px solid ${
                          registerErrors.password ? '#dc2626' : 'var(--border-color)'
                        }`,
                        borderRadius: 'var(--radius-md, 8px)',
                        fontSize: '1.08rem',
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
                      {showRegisterPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {registerErrors.password && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.88rem',
                        marginTop: '6px',
                        display: 'block',
                      }}
                    >
                      {registerErrors.password}
                    </span>
                  )}
                </div>

                {/* Retype Password */}
                <div style={{ marginBottom: '1.85rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '0.6rem',
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
                        padding: '0.95rem 2.85rem 0.95rem 1.15rem',
                        border: `1px solid ${
                          registerErrors.confirmPassword ? '#dc2626' : 'var(--border-color)'
                        }`,
                        borderRadius: 'var(--radius-md, 8px)',
                        fontSize: '1.08rem',
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
                      {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {registerErrors.confirmPassword && (
                    <span
                      style={{
                        color: '#dc2626',
                        fontSize: '0.88rem',
                        marginTop: '6px',
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
                      fontSize: '0.92rem',
                      marginBottom: '1.35rem',
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
                    padding: '0.95rem 1.35rem',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '1.12rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  <span>{loading ? t('chat_processing') : t('partner_register_btn')}</span>
                  <ArrowRight size={20} />
                </button>

                {/* Secondary Action: Back to Sign In */}
                <div
                  style={{
                    marginTop: '2rem',
                    paddingTop: '1.75rem',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.05rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.85rem',
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
                      padding: '0.9rem 1.25rem',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md, 8px)',
                      color: 'var(--text-main)',
                      fontSize: '1.06rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      fontFamily: kmFont,
                    }}
                  >
                    {t('sign_in')}
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Switcher: Link to Patient App */}
            <div
              style={{
                marginTop: '2.25rem',
                paddingTop: '1.75rem',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                onClick={handlePatientSwitch}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '6px 12px',
                  fontFamily: kmFont,
                }}
              >
                {t('partner_switch_to_patient')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
