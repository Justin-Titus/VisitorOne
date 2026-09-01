import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageEmployees from './pages/admin/ManageEmployees';
import Reports from './pages/admin/Reports';
import ActivityHistory from './pages/admin/ActivityHistory';

// Receptionist pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import RegisterVisitor from './pages/receptionist/RegisterVisitor';

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

// Shared pages
import VisitorRequests from './pages/shared/VisitorRequests';

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'receptionist') return <ReceptionistDashboard />;
  if (user?.role === 'employee') return <EmployeeDashboard />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRouter />} />

        {/* Admin only */}
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedRoute roles={['admin']}>
              <ManageEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={['admin', 'receptionist']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="activity-history"
          element={
            <ProtectedRoute roles={['admin']}>
              <ActivityHistory />
            </ProtectedRoute>
          }
        />

        {/* Receptionist only */}
        <Route
          path="register-visitor"
          element={
            <ProtectedRoute roles={['receptionist']}>
              <RegisterVisitor />
            </ProtectedRoute>
          }
        />

        {/* All authenticated roles */}
        <Route
          path="visitor-requests"
          element={
            <ProtectedRoute>
              <VisitorRequests />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
