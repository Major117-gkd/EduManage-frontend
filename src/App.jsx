import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentsPage from './pages/admin/StudentsPage'
import TeachersPage from './pages/admin/TeachersPage'
import ClassesPage from './pages/admin/ClassesPage'
import GradesPage from './pages/admin/GradesPage'
import ResultsPage from './pages/admin/ResultsPage'
import SubjectsPage from './pages/admin/SubjectsPage'
import AcademicYearsPage from './pages/admin/AcademicYearsPage'
import SettingsPage from './pages/admin/SettingsPage'
import TeacherLayout from './pages/teacher/TeacherLayout'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import SchoolInfoPage from './pages/SchoolInfoPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/infos" element={<SchoolInfoPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="years" element={<AcademicYearsPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="grades/results" element={<ResultsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
