import { env } from '@app/env';
import axios from 'axios';
import { ssrApiHeaders } from './ssr-headers';

export const API = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

API.interceptors.request.use((request) => {
  request.headers.set(ssrApiHeaders());
  return request;
});
