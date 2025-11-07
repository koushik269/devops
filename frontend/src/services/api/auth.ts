import { api } from '../api';
import { LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),

  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register', data),

  logout: () =>
    api.post('/auth/logout'),

  refreshToken: (data: { refreshToken: string }) =>
    api.post<{ success: boolean; data: { tokens: any } }>('/auth/refresh-token', data),

  verifyEmail: (data: { token: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/verify-email', data),

  verify2FA: (data: { token: string; tempToken: string }) =>
    api.post<AuthResponse>('/auth/verify-2fa', data),

  getProfile: () =>
    api.get<{ success: boolean; data: { user: any } }>('/auth/profile'),

  forgotPassword: (data: { email: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', data),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/change-password', data),

  enable2FA: () =>
    api.post<{ success: boolean; data: { secret: string; qrCode: string } }>('/auth/enable-2fa'),

  verifyAndEnable2FA: (data: { token: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/verify-and-enable-2fa', data),

  disable2FA: (data: { password: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/disable-2fa'),
};