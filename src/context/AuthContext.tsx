import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { loginUser, registerUser } from '../services/api';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  login: (phoneOrEmail: string) => Promise<void>;
  register: (payload: { name: string; phone: string; address?: string; city?: string; email?: string }) => Promise<void>;
  logout: () => void;
  allDemoUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Client (Sarra Mansour) for immediate user journey
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('bebba_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USERS[4]; // Sarra Mansour (client)
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(currentUser.role);

  useEffect(() => {
    localStorage.setItem('bebba_user', JSON.stringify(currentUser));
    setCurrentRole(currentUser.role);
  }, [currentUser]);

  const switchDemoRole = async (role: UserRole) => {
    try {
      const u = await loginUser(undefined, role);
      setCurrentUser(u);
      setCurrentRole(u.role);
    } catch (e) {
      const localUser = INITIAL_USERS.find(usr => usr.role === role);
      if (localUser) {
        setCurrentUser(localUser);
        setCurrentRole(localUser.role);
      }
    }
  };

  const login = async (phoneOrEmail: string) => {
    const user = await loginUser(phoneOrEmail);
    setCurrentUser(user);
    setCurrentRole(user.role);
  };

  const register = async (payload: { name: string; phone: string; address?: string; city?: string; email?: string }) => {
    const user = await registerUser(payload);
    setCurrentUser(user);
    setCurrentRole(user.role);
  };

  const logout = () => {
    // Switch to client demo as base
    const defaultClient = INITIAL_USERS.find(u => u.role === 'client') || INITIAL_USERS[0];
    setCurrentUser(defaultClient);
    setCurrentRole('client');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        switchDemoRole,
        login,
        register,
        logout,
        allDemoUsers: INITIAL_USERS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
