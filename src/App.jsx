import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentsPage from './pages/admin/StudentsPage'
import TeachersPage from './pages/admin/TeachersPage'
import ClassesPage from './pages/admin/ClassesPage'
import GradesLayout from './pages/admin/GradesLayout'
import GradesViewPage from './pages/admin/GradesViewPage'
import ResultsPage from './pages/admin/ResultsPage'
import SubjectsPage from './pages/admin/SubjectsPage'
import AcademicYearsPage from './pages/admin/AcademicYearsPage'
import PaymentsPage from './pages/admin/PaymentsPage'
import TeacherPayPage from './pages/admin/TeacherPayPage'
import NiveauxPage from './pages/admin/NiveauxPage'
import SettingsPage from './pages/admin/SettingsPage'
import NotificationsPage from './pages/admin/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import TeacherLayout from './pages/teacher/TeacherLayout'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherGradesPage from './pages/teacher/TeacherGradesPage'
import TeacherRemunerationPage from './pages/teacher/TeacherRemunerationPage'
import SchoolInfoPage from './pages/SchoolInfoPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/infos" element={<SchoolInfoPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="niveaux" element={<NiveauxPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="years" element={<AcademicYearsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="teacher-pay" element={<TeacherPayPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="grades" element={<GradesLayout />}>
            <Route index element={<Navigate to="consultation" replace />} />
            <Route path="consultation" element={<GradesViewPage />} />
            <Route path="results" element={<ResultsPage />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={['PROFESSEUR']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="pay" element={<TeacherRemunerationPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="grades/:matiereId" element={<TeacherGradesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
