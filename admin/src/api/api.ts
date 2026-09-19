import { env } from '@app/env';
import axios from 'axios';

export const API = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

