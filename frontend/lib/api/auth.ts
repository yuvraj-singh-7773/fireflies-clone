import { get, post } from './client';
import { AuthResponse, User } from '@/types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  display_name: string;
}

export const login = (data: LoginInput) => post<AuthResponse>('/api/auth/login', data);
export const register = (data: RegisterInput) => post<AuthResponse>('/api/auth/register', data);
export const getCurrentUser = () => get<User>('/api/auth/me');
export const logout = () => post<void>('/api/auth/logout', {});
