import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';

// ─── Subjects ─────────────────────────────────────────────────────────────────
export const useSubjects = () =>
  useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then((r) => r.data.subjects) });

export const useCreateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/subjects', data).then((r) => r.data.subject),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
};

export const useDeleteSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
};

export const useUpdateSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/subjects/${id}`, data).then((r) => r.data.subject),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['safe-bunks'] });
    },
  });
};

// ─── Timetable ────────────────────────────────────────────────────────────────
export const useTimetable = () =>
  useQuery({ queryKey: ['timetable'], queryFn: () => api.get('/timetable').then((r) => r.data) });

export const useTodaySlots = () =>
  useQuery({ queryKey: ['today-slots'], queryFn: () => api.get('/timetable/today').then((r) => r.data) });

export const useAddSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/timetable/slots', data).then((r) => r.data.slot),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  });
};

export const useDeleteSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/timetable/slots/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  });
};

export const useUpdateSlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/timetable/slots/${id}`, data).then((r) => r.data.slot),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  });
};

export const useCalendar = () =>
  useQuery({ queryKey: ['calendar'], queryFn: () => api.get('/timetable/calendar').then((r) => r.data.entries) });

export const useAddCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/timetable/calendar', data).then((r) => r.data.entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
};

export const useDeleteCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/timetable/calendar/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
};

export const useUpdateCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/timetable/calendar/${id}`, data).then((r) => r.data.entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const useTodayAttendance = () =>
  useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today').then((r) => r.data),
    refetchInterval: 60_000, // refresh every minute
  });

export const useUpdateAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.put(`/attendance/${id}`, { status }).then((r) => r.data.record),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['history'] });
    },
  });
};

export const useAttendanceStats = () =>
  useQuery({ queryKey: ['stats'], queryFn: () => api.get('/attendance/stats').then((r) => r.data.stats) });

export const useAttendanceHistory = (filters = {}) =>
  useQuery({
    queryKey: ['history', filters],
    queryFn: () => api.get('/attendance/history', { params: filters }).then((r) => r.data.records),
  });

// ─── Bunk Planner ─────────────────────────────────────────────────────────────
export const useSafeBunks = () =>
  useQuery({ queryKey: ['safe-bunks'], queryFn: () => api.get('/bunk/safe').then((r) => r.data.stats) });

export const useAISuggestion = () =>
  useMutation({ mutationFn: () => api.post('/bunk/ai-suggest').then((r) => r.data) });

export const useLogMood = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mood) => api.post('/bunk/mood', { mood }).then((r) => r.data.log),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['safe-bunks'] }),
  });
};

export const useChat = () =>
  useMutation({
    mutationFn: ({ message, conversationHistory }) =>
      api.post('/bunk/chat', { message, conversationHistory }).then((r) => r.data.reply),
  });
