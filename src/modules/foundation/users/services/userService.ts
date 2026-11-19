import { apiClient } from '../../../../services/api/axiosInstance';
import type { CreateUserInput, UpdateOwnProfileInput, UpdateUserInput, User } from '../models';

/** GET /users */
export async function listUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users');
  return data;
}

/** POST /users */
export async function createUser(payload: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<User>('/users', payload);
  return data;
}

/** PATCH /users/:id */
export async function updateUser(userId: string, payload: UpdateUserInput): Promise<User> {
  const { data } = await apiClient.patch<User>(`/users/${userId}`, payload);
  return data;
}

/** Soft-delete helper (PATCH active: false). */
export async function deactivateUser(userId: string): Promise<User> {
  return updateUser(userId, { active: false });
}

/** Reactivation helper (PATCH active: true). */
export async function reactivateUser(userId: string): Promise<User> {
  return updateUser(userId, { active: true });
}

/** PATCH /users/me never accepts an account ID or administrative properties. */
export async function updateOwnProfile(payload: UpdateOwnProfileInput): Promise<User> {
  const body: UpdateOwnProfileInput = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.password !== undefined) body.password = payload.password;
  const { data } = await apiClient.patch<User>('/users/me', body);
  return data;
}
