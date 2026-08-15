import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Supervisors from './pages/Supervisors';
import Employees from './pages/Employees';
import Register from './pages/Register';
import RegisterEntries from './pages/register/Entries';
import RegisterExits from './pages/register/Exits';
import RegisterAbsences from './pages/register/Absences';
import RegisterLate from './pages/register/Late';
import RegisterObservations from './pages/register/Observations';
import Payments from './pages/Payments';
import Backup from './pages/Backup';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Routes protégées — accessibles uniquement si connecté */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/supervisors" element={<Supervisors />} />
            <Route path="/employees" element={<Employees />} />

            <Route path="/register" element={<Register />}>
              <Route path="entries" element={<RegisterEntries />} />
              <Route path="exits" element={<RegisterExits />} />
              <Route path="absences" element={<RegisterAbsences />} />
              <Route path="late" element={<RegisterLate />} />
              <Route path="observations" element={<RegisterObservations />} />
            </Route>

            <Route path="/payments" element={<Payments />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
