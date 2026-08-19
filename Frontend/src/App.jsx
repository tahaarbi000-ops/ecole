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
import AbsenceEleves from './pages/register/AbsenceEleves';
import AbsenceMaitres from './pages/register/AbsenceMaitres';
import AbsenceSurveillants from './pages/register/AbsenceSurveillants';
import AbsenceEmployes from './pages/register/AbsenceEmployes';
import Late from './pages/register/Late';
import Observations from './pages/register/Observations';
import TeacherMovements from './pages/register/TeacherMovements';
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
              <Route path="absences" element={<Navigate to="/register/absences/eleves" replace />} />
              <Route path="absences/eleves" element={<AbsenceEleves />} />
              <Route path="absences/maitres" element={<AbsenceMaitres />} />
              <Route path="absences/surveillants" element={<AbsenceSurveillants />} />
              <Route path="absences/employes" element={<AbsenceEmployes />} />
              <Route path="late" element={<Late />} />
              <Route path="observations" element={<Observations />} />
              <Route path="teacher-movements" element={<TeacherMovements />} />
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
