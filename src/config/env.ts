/**
 * Centralized application environment configuration.
 * Values are read from Vite environment variables (see .env.example).
 * No secrets are stored in frontend environment variables.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
