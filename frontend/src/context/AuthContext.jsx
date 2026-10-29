import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(sessionStorage.getItem('csrfToken') || null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount / page refresh (PDF 2 Section 4.2)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const meRes = await authService.getMe();
        if (meRes?.success && meRes?.data?.user) {
          setUser(meRes.data.user);

          // Restore CSRF token for the active session
          try {
            const csrfRes = await authService.getCsrfToken();
            if (csrfRes?.success && csrfRes?.csrfToken) {
              setCsrfToken(csrfRes.csrfToken);
              sessionStorage.setItem('csrfToken', csrfRes.csrfToken);
            }
          } catch (csrfErr) {
            console.warn('Failed to fetch session CSRF token:', csrfErr);
          }
        } else {
          setUser(null);
          sessionStorage.removeItem('csrfToken');
        }
      } catch (err) {
        // 401 Unauthorized or expired session
        setUser(null);
        sessionStorage.removeItem('csrfToken');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res?.success && res?.data?.user) {
      setUser(res.data.user);
      if (res.data.csrfToken) {
        setCsrfToken(res.data.csrfToken);
        sessionStorage.setItem('csrfToken', res.data.csrfToken);
      }
    }
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
      setCsrfToken(null);
      sessionStorage.removeItem('csrfToken');
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF',
    isAuthenticated: !!user,
    loading,
    csrfToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
