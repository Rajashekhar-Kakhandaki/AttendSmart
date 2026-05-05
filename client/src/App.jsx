import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

import Login        from './pages/Login';
import Register     from './pages/Register';
import Dashboard    from './pages/Dashboard';
import Today        from './pages/Today';
import BunkPlanner  from './pages/BunkPlanner';
import Setup        from './pages/Setup';
import History      from './pages/History';
import Analytics    from './pages/Analytics';
import CalendarPage from './pages/CalendarPage';
import Layout       from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index              element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="today"      element={<Today />} />
          <Route path="planner"    element={<BunkPlanner />} />
          <Route path="history"    element={<History />} />
          <Route path="analytics"  element={<Analytics />} />
          <Route path="calendar"   element={<CalendarPage />} />
          <Route path="setup"      element={<Setup />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
