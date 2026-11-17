import { apiClient } from '../../../../services/api/axiosInstance';
import { publicRequestConfig } from '../../../../services/api/publicRequest';
import type { LoginCredentials, LoginResponse, ProfileUser } from '../models';

/**
 * POST /auth/login — public endpoint.
 * The request is marked as public so the auth interceptor does not attach a
 * Bearer token. Errors are rejected as AppError by the response interceptor.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials, publicRequestConfig());
  return data;
}

/**
 * GET /auth/profile — requires a Bearer token (attached by the interceptor).
 * Returns the full session user, including the `active` field.
 */
export async function getProfile(): Promise<ProfileUser> {
  const { data } = await apiClient.get<ProfileUser>('/auth/profile');
  return data;
}
