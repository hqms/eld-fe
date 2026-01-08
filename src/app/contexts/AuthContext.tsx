import React, { createContext, useContext, useState, ReactNode } from 'react';
import { obtainToken, setTokens, clearTokens, fetchMe } from '../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
  cycleHoursUsed: number;
  cycleHoursLimit: number;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  updateCycleHours: (hours: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const mockUser: User = {
  id: '1',
  name: 'John Driver',
  email: 'john.driver@example.com',
  licenseNumber: 'CDL-12345678',
  cycleHoursUsed: 45.5,
  cycleHoursLimit: 70,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await obtainToken(username, password);
      if (res.ok && res.data && res.data.access && res.data.refresh) {
        setTokens({ access: res.data.access, refresh: res.data.refresh });
        // Minimal user info until backend provides a user endpoint
        setUser({ ...mockUser, name: username, email: username });
        fetchMe();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    // Unimplemented: 
    // fall back to mock Google flow; integrate real OAuth separately
    await new Promise(resolve => setTimeout(resolve, 800));
    setUser({
      ...mockUser,
      name: 'John Driver (Google)',
      email: 'john.driver@gmail.com',
    });
    return true;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const updateCycleHours = (hours: number) => {
    if (user) {
      setUser({
        ...user,
        cycleHoursUsed: Math.min(user.cycleHoursUsed + hours, user.cycleHoursLimit),
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, updateCycleHours }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
