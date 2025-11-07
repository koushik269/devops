import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { authApi } from '@/services/api/auth';
import { User, AuthTokens, LoginCredentials, RegisterData, AuthState, AuthContextType } from '@/types/auth';

interface AuthAction {
  type: string;
  payload?: any;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: true,
  isAuthenticated: false,
  requires2FA: false,
  tempToken: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isLoading: false,
        isAuthenticated: true,
        requires2FA: false,
        tempToken: null,
      };
    case '2FA_REQUIRED':
      return {
        ...state,
        requires2FA: true,
        tempToken: action.payload.tempToken,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        requires2FA: false,
        tempToken: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'INIT_AUTH':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Initialize authentication state from cookies
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');
        const userData = localStorage.getItem('user');

        if (accessToken && refreshToken && userData) {
          const user = JSON.parse(userData);
          dispatch({
            type: 'INIT_AUTH',
            payload: { user, tokens: { accessToken, refreshToken } },
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const setAuthData = (user: User, tokens: AuthTokens, rememberMe = false) => {
    // Store tokens in cookies
    const expires = rememberMe ? 7 : 1; // days
    Cookies.set('accessToken', tokens.accessToken, { expires });
    Cookies.set('refreshToken', tokens.refreshToken, { expires });

    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user));

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, tokens },
    });
  };

  const clearAuthData = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('user');

    dispatch({ type: 'LOGOUT' });
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authApi.login(credentials);

      if (response.success) {
        if (response.data.requires2FA) {
          dispatch({
            type: '2FA_REQUIRED',
            payload: { tempToken: response.data.tempToken },
          });
        } else {
          setAuthData(response.data.user, response.data.tokens!, credentials.rememberMe);
          toast.success('Login successful!');
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authApi.register(data);

      if (response.success) {
        toast.success(response.message);
        router.push('/login?message=Please check your email to verify your account');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      toast.success('Logged out successfully');
      router.push('/login');
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken({ refreshToken });

      if (response.success) {
        const newTokens = response.data.tokens;
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        setAuthData(user, newTokens);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      router.push('/login');
    }
  };

  const verifyEmail = async (token: string): Promise<void> => {
    try {
      const response = await authApi.verifyEmail({ token });

      if (response.success) {
        toast.success('Email verified successfully!');
        router.push('/login?message=Email verified. You can now login.');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Email verification failed';
      toast.error(message);
      throw error;
    }
  };

  const verify2FA = async (token: string, tempToken: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authApi.verify2FA({ token, tempToken });

      if (response.success) {
        setAuthData(response.data.user, response.data.tokens);
        toast.success('2FA verification successful!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.error || '2FA verification failed';
      toast.error(message);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    verifyEmail,
    verify2FA,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};