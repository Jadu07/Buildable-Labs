import api from './api.service';
import { User } from '../types';

export const authService = {
  async register(data: any): Promise<{ user: User; token: string }> {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  async login(data: any): Promise<{ user: User; token: string }> {
    const res = await api.post('/auth/login', data);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async updateProfile(data: any): Promise<User> {
    const res = await api.put('/auth/profile', data);
    return res.data.data;
  },

  async updatePassword(data: any): Promise<void> {
    await api.put('/auth/password', data);
  },
};
