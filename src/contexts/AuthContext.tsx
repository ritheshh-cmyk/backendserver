import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RolePermissions } from '../../shared/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: keyof RolePermissions['admin']) => boolean;
  canAccessWorkersPage: () => boolean;
  canAccessOwnersPage: () => boolean;
  canManageUsers: () => boolean;
  canViewAllData: () => boolean;
  canManageSystem: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based permissions mapping
const rolePermissions: RolePermissions = {
  admin: {
    canAccessWorkersPage: true,
    canAccessOwnersPage: true,
    canManageUsers: true,
    canViewAllData: true,
    canManageSystem: true,
  },
  owner: {
    canAccessWorkersPage: false,
    canAccessOwnersPage: true,
    canManageUsers: false,
    canViewAllData: true,
    canManageSystem: false,
  },
  worker: {
    canAccessWorkersPage: true,
    canAccessOwnersPage: false,
    canManageUsers: false,
    canViewAllData: false,
    canManageSystem: false,
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('authToken', data.token);
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  // Permission checking functions
  const hasPermission = (permission: keyof RolePermissions['admin']): boolean => {
    if (!user) return false;
    return rolePermissions[user.role]?.[permission] || false;
  };

  const canAccessWorkersPage = (): boolean => {
    return hasPermission('canAccessWorkersPage');
  };

  const canAccessOwnersPage = (): boolean => {
    return hasPermission('canAccessOwnersPage');
  };

  const canManageUsers = (): boolean => {
    return hasPermission('canManageUsers');
  };

  const canViewAllData = (): boolean => {
    return hasPermission('canViewAllData');
  };

  const canManageSystem = (): boolean => {
    return hasPermission('canManageSystem');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    error,
    hasPermission,
    canAccessWorkersPage,
    canAccessOwnersPage,
    canManageUsers,
    canViewAllData,
    canManageSystem,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 