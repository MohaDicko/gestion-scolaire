import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Pages
import { StudentsPage } from '../features/academic/pages/StudentsPage';
import { StudentCardsPage } from '../features/academic/pages/StudentCardsPage';
import { StudentDetailPage } from '../features/academic/pages/StudentDetailPage';
import { StudentPortalPage } from '../features/academic/pages/StudentPortalPage';
import { ClassroomsPage } from '../features/academic/pages/ClassroomsPage';
import { GradesPage } from '../features/academic/pages/GradesPage';
import { EnrollmentsPage } from '../features/academic/pages/EnrollmentsPage';
import { AttendancePage } from '../features/academic/pages/AttendancePage';
import { TimetablePage } from '../features/academic/pages/TimetablePage';
import { BulletinPage } from '../features/academic/pages/BulletinPage';

export const AcademicRoutes = () => (
  <Routes>
    <Route element={<ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin', 'Teacher']} />}>
      <Route path="students" element={<StudentsPage />} />
      <Route path="students/:id" element={<StudentDetailPage />} />
      <Route path="cards" element={<StudentCardsPage />} />
      <Route path="students/:id/portal" element={<StudentPortalPage />} />
      <Route path="classrooms" element={<ClassroomsPage />} />
      <Route path="grades" element={<GradesPage />} />
      <Route path="enrollments" element={<EnrollmentsPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="timetable" element={<TimetablePage />} />
      <Route path="bulletins" element={<BulletinPage />} />
    </Route>
  </Routes>
);

