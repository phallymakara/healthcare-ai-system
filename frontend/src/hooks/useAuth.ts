import { useState, useEffect, useCallback } from 'react';
import { AuthService, UserProfile } from '../services/auth';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => AuthService.getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!AuthService.getAccessToken());

  const checkAuth = useCallback(() => {
    const token = AuthService.getAccessToken();
    setIsAuthenticated(!!token);
    setCurrentUser(AuthService.getStoredUser());
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [checkAuth]);

  const logout = useCallback(() => {
    AuthService.clearSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  return {
    isAuthenticated,
    user: currentUser,
    role: currentUser?.role,
    hospitalId: currentUser?.hospital_id,
    logout,
    refreshAuth: checkAuth,
  };
}

export default useAuth;
