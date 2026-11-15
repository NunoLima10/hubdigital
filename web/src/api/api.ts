import { env } from '@app/env';
import axios from 'axios';
import { ssrApiBaseUrl, ssrApiHeaders } from './ssr-headers';

export const API = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

API.interceptors.request.use((request) => {
  request.baseURL = ssrApiBaseUrl(env.API_URL);
  request.headers.set(ssrApiHeaders());
  return request;
});
