import axios from 'axios';

export const axiosForBackend = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

