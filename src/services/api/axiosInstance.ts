import axios from 'axios';
import { API_BASE_URL } from '../../config/env';
import { authRequestInterceptor } from './interceptors/authRequestInterceptor';
import { errorResponseInterceptor } from './interceptors/errorResponseInterceptor';

/**
 * Single shared Axios instance for every HTTP request of the application.
 * All services must consume this instance instead of creating their own.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(authRequestInterceptor);
apiClient.interceptors.response.use((response) => response, errorResponseInterceptor);
