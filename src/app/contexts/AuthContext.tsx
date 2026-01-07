import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Accept any non-empty credentials for demo
    if (username && password) {
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    // Simulate Google OAuth
    await new Promise(resolve => setTimeout(resolve, 800));
    setUser({
      ...mockUser,
      name: 'John Driver (Google)',
      email: 'john.driver@gmail.com',
    });
    return true;
  };

  const logout = () => {
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
