import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import StudentLogin from './pages/StudentLogin'
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
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentGradesPage from './pages/student/StudentGradesPage'
import StudentBulletinPage from './pages/student/StudentBulletinPage'
import StudentPaymentsPage from './pages/student/StudentPaymentsPage'
import ParentLayout from './pages/parent/ParentLayout'
import ParentDashboard from './pages/parent/ParentDashboard'
import ParentGradesPage from './pages/parent/ParentGradesPage'
import ParentBulletinPage from './pages/parent/ParentBulletinPage'
import ParentPaymentsPage from './pages/parent/ParentPaymentsPage'
import UsersPage from './pages/admin/UsersPage'
import FinancialReportsPage from './pages/admin/FinancialReportsPage'
import AnnouncementsPage from './pages/admin/AnnouncementsPage'
import PublicAnnouncementsPage from './pages/AnnouncementsPage'
import UserAnnouncementsPage from './pages/shared/UserAnnouncementsPage'
import SchoolInfoPage from './pages/SchoolInfoPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/eleve" element={<StudentLogin />} />
        <Route path="/infos" element={<SchoolInfoPage />} />
        <Route path="/annonces" element={<PublicAnnouncementsPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN', 'COMPTABLE', 'DIRECTEUR']}>
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
          <Route path="reports/finance" element={<FinancialReportsPage />} />
          <Route path="teacher-pay" element={<TeacherPayPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="annonces" element={<AnnouncementsPage />} />
          <Route path="annonces/consulter" element={<UserAnnouncementsPage subtitle="Annonces publiées — vue lecture" />} />
          <Route path="grades" element={<GradesLayout />}>
            <Route index element={<Navigate to="consultation" replace />} />
            <Route path="consultation" element={<GradesViewPage />} />
            <Route path="results" element={<ResultsPage />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
          <Route path="users" element={<UsersPage />} />
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
          <Route path="annonces" element={<UserAnnouncementsPage />} />
        </Route>
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={['ELEVE']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="notes" element={<StudentGradesPage />} />
          <Route path="bulletin" element={<StudentBulletinPage />} />
          <Route path="paiements" element={<StudentPaymentsPage />} />
          <Route path="annonces" element={<UserAnnouncementsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route
          path="/parent"
          element={
            <ProtectedRoute roles={['PARENT']}>
              <ParentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ParentDashboard />} />
          <Route path="notes" element={<ParentGradesPage />} />
          <Route path="bulletin" element={<ParentBulletinPage />} />
          <Route path="paiements" element={<ParentPaymentsPage />} />
          <Route path="annonces" element={<UserAnnouncementsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
