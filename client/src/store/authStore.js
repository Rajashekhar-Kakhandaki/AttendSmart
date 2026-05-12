import { create } from 'zustand';
import api from '../api/client';
import { queryClient } from '../main';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('bs_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('bs_token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Login failed';
      set({ error, isLoading: false });
      return { success: false, error };
    }
  },

  register: async (name, email, password, minThreshold) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password, minThreshold });
      localStorage.setItem('bs_token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Registration failed';
      set({ error, isLoading: false });
      return { success: false, error };
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      set({ user: null, token: null });
      localStorage.removeItem('bs_token');
    }
  },

  logout: () => {
    // Cancel all in-flight queries and wipe cached data instantly
    queryClient.cancelQueries();
    queryClient.clear();
    localStorage.removeItem('bs_token');
    set({ user: null, token: null });
  },

  updateUser: (updatedUser) => set({ user: updatedUser }),
}));

export default useAuthStore;
