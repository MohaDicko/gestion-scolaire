import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { AppLayout } from './app/AppLayout';

// Pages — Auth
import { LoginPage } from './features/auth/pages/LoginPage';
import { UnauthorizedPage } from './features/auth/pages/UnauthorizedPage';

// Pages — Dashboard
import { DashboardPage } from './features/dashboard/pages/DashboardPage';

// Pages — Academic
import { StudentsPage } from './features/academic/pages/StudentsPage';
import { StudentCardsPage } from './features/academic/pages/StudentCardsPage';
import { StudentDetailPage } from './features/academic/pages/StudentDetailPage';
import { StudentPortalPage } from './features/academic/pages/StudentPortalPage';
import { ClassroomsPage } from './features/academic/pages/ClassroomsPage';
import { GradesPage } from './features/academic/pages/GradesPage';
import { EnrollmentsPage } from './features/academic/pages/EnrollmentsPage';
import { AttendancePage } from './features/academic/pages/AttendancePage';
import { TimetablePage } from './features/academic/pages/TimetablePage';

// Pages — HR
import { EmployeesPage } from './features/hr/pages/EmployeesPage';
import { EmployeeDetailPage } from './features/hr/pages/EmployeeDetailPage';
import { ContractsPage } from './features/hr/pages/ContractsPage';
import { LeavesPage } from './features/hr/pages/LeavesPage';
import { StaffAttendancePage } from './features/hr/pages/StaffAttendancePage';

// Pages — Payroll
import { PayrollRunsPage } from './features/payroll/pages/PayrollRunsPage';
import { PayslipsPage } from './features/payroll/pages/PayslipsPage';

// Pages — Finance
import { InvoicesPage } from './features/finance/pages/InvoicesPage';
import { PaymentsPage } from './features/finance/pages/PaymentsPage';
import { ExpensesPage } from './features/finance/pages/ExpensesPage';
import { FinanceOverviewPage } from './features/finance/pages/FinanceOverviewPage';

// Pages — Notifications
import { SendNotificationPage } from './features/notifications/pages/SendNotificationPage';

// Pages — Events
import { CalendarPage } from './features/events/pages/CalendarPage';

// Pages — Settings & Reports
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { AnnualReportPage } from './features/reports/pages/AnnualReportPage';
import { SmartQueriesPage } from './features/reports/pages/SmartQueriesPage';
import { UserManagementPage } from './features/admin/pages/UserManagementPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes — Any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Academic — Teachers, SchoolAdmin, SuperAdmin */}
              <Route
                element={<ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin', 'Teacher']} />}
              >
                <Route path="/academic/students" element={<StudentsPage />} />
                <Route path="/academic/students/:id" element={<StudentDetailPage />} />
                <Route path="/academic/cards" element={<StudentCardsPage />} />
                <Route path="/academic/students/:id/portal" element={<StudentPortalPage />} />
                <Route path="/academic/classrooms" element={<ClassroomsPage />} />
                <Route path="/academic/grades" element={<GradesPage />} />
                <Route path="/academic/enrollments" element={<EnrollmentsPage />} />
                <Route path="/academic/attendance" element={<AttendancePage />} />
                <Route path="/academic/timetable" element={<TimetablePage />} />
              </Route>

              {/* Finance — Accountant, SchoolAdmin, SuperAdmin */}
              <Route
                element={<ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin', 'Accountant']} />}
              >
                <Route path="/finance" element={<FinanceOverviewPage />} />
                <Route path="/finance/invoices" element={<InvoicesPage />} />
                <Route path="/finance/payments" element={<PaymentsPage />} />
                <Route path="/finance/expenses" element={<ExpensesPage />} />
              </Route>

              {/* Notifications - Admin only */}
              <Route element={<ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin']} />}>
                <Route path="/notifications/send" element={<SendNotificationPage />} />
              </Route>

              {/* Calendar - accessible to all */}
              <Route path="/calendar" element={<CalendarPage />} />
              {/* Settings & Reports */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/reports/annual" element={<AnnualReportPage />} />
              <Route path="/reports/smart" element={<SmartQueriesPage />} />
              {/* Admin - User Management */}
              <Route element={<ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin']} />}>
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>
              <Route
                element={<ProtectedRoute roles={['SuperAdmin', 'SchoolAdmin', 'HR_Manager']} />}
              >
                <Route path="/hr/employees" element={<EmployeesPage />} />
                <Route path="/hr/employees/:id" element={<EmployeeDetailPage />} />
                <Route path="/hr/contracts" element={<ContractsPage />} />
                <Route path="/hr/leaves" element={<LeavesPage />} />
                <Route path="/hr/attendance" element={<StaffAttendancePage />} />
              </Route>

              {/* Payroll — Accountant, HR_Manager, SchoolAdmin, SuperAdmin */}
              <Route
                element={
                  <ProtectedRoute
                    roles={['SuperAdmin', 'SchoolAdmin', 'HR_Manager', 'Accountant']}
                  />
                }
              >
                <Route path="/payroll/runs" element={<PayrollRunsPage />} />
                <Route path="/payroll/runs/:runId" element={<PayslipsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
