import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PublicRoute from '../components/common/PublicRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import DashboardPage from '../pages/DashboardPage';
import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import StudentSkillsPage from '../pages/student/StudentSkillsPage';
import StudentTopicsPage from '../pages/student/StudentTopicsPage';
import StudentEducationPage from '../pages/student/StudentEducationPage';
import StudentResumePage from '../pages/student/StudentResumePage';
import StudentProjectsPage from '../pages/student/StudentProjectsPage';
import StudentInternshipsPage from '../pages/student/StudentInternshipsPage';
import StudentCertificationsPage from '../pages/student/StudentCertificationsPage';
import StudentPortfolioPage from '../pages/student/StudentPortfolioPage';
import StudentRecommendationsPage from '../pages/student/StudentRecommendationsPage';
import StudentAssessmentPage from '../pages/student/StudentAssessmentPage';
import StudentAssessmentResultPage from '../pages/student/StudentAssessmentResultPage';
import StudentLeaderboardPage from '../pages/student/StudentLeaderboardPage';
import StudentOpportunitiesPage from '../pages/student/StudentOpportunitiesPage';
import StudentOpportunityDetailsPage from '../pages/student/StudentOpportunityDetailsPage';
import StudentApplicationsPage from '../pages/student/StudentApplicationsPage';
import IndustryDashboardPage from '../pages/industry/IndustryDashboardPage';
import IndustryCompanyPage from '../pages/industry/IndustryCompanyPage';
import IndustryCandidatesPage from '../pages/industry/IndustryCandidatesPage';
import IndustryApplicationsPage from '../pages/industry/IndustryApplicationsPage';
import IndustryOpportunitiesPage from '../pages/industry/IndustryOpportunitiesPage';
import IndustryOpportunityCreatePage from '../pages/industry/IndustryOpportunityCreatePage';
import IndustryOpportunityDetailsPage from '../pages/industry/IndustryOpportunityDetailsPage';
import MatchExplanationPage from '../pages/industry/MatchExplanationPage';
import FacultyDashboardPage from '../pages/faculty/FacultyDashboardPage';
import FacultyStudentsPage from '../pages/faculty/FacultyStudentsPage';
import FacultyAnalyticsPage from '../pages/faculty/FacultyAnalyticsPage';
import PlacementDashboardPage from '../pages/placement/PlacementDashboardPage';
import PlacementStudentsPage from '../pages/placement/PlacementStudentsPage';
import PlacementAnalyticsPage from '../pages/placement/PlacementAnalyticsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminStudentsPage from '../pages/admin/AdminStudentsPage';
import AdminStudentApprovalsPage from '../pages/admin/AdminStudentApprovalsPage';
import AdminFacultyPage from '../pages/admin/AdminFacultyPage';
import AdminIndustryPage from '../pages/admin/AdminIndustryPage';
import AdminPlacementCellPage from '../pages/admin/AdminPlacementCellPage';
import AdminJobsPage from '../pages/admin/AdminJobsPage';
import AdminInternshipsPage from '../pages/admin/AdminInternshipsPage';
import AdminApplicationsPage from '../pages/admin/AdminApplicationsPage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

const allowedDashboardRoles = ['student', 'faculty', 'placement', 'industry', 'admin'];
const studentRoles = ['student'];

function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={allowedDashboardRoles}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={studentRoles}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/student/profile" element={<ProtectedRoute allowedRoles={studentRoles}><StudentProfilePage /></ProtectedRoute>} />
        <Route path="/student/skills" element={<ProtectedRoute allowedRoles={studentRoles}><StudentSkillsPage /></ProtectedRoute>} />
        <Route path="/student/topics" element={<ProtectedRoute allowedRoles={studentRoles}><StudentTopicsPage /></ProtectedRoute>} />
        <Route path="/student/education" element={<ProtectedRoute allowedRoles={studentRoles}><StudentEducationPage /></ProtectedRoute>} />
        <Route path="/student/resume" element={<ProtectedRoute allowedRoles={studentRoles}><StudentResumePage /></ProtectedRoute>} />
        <Route path="/student/projects" element={<ProtectedRoute allowedRoles={studentRoles}><StudentProjectsPage /></ProtectedRoute>} />
        <Route path="/student/internships" element={<ProtectedRoute allowedRoles={studentRoles}><StudentInternshipsPage /></ProtectedRoute>} />
        <Route path="/student/certifications" element={<ProtectedRoute allowedRoles={studentRoles}><StudentCertificationsPage /></ProtectedRoute>} />
        <Route path="/student/portfolio" element={<ProtectedRoute allowedRoles={studentRoles}><StudentPortfolioPage /></ProtectedRoute>} />
        <Route path="/student/recommendations" element={<ProtectedRoute allowedRoles={studentRoles}><StudentRecommendationsPage /></ProtectedRoute>} />
        <Route path="/student/assessments" element={<ProtectedRoute allowedRoles={studentRoles}><StudentAssessmentPage /></ProtectedRoute>} />
        <Route path="/student/assessment-result/:assessmentId" element={<ProtectedRoute allowedRoles={studentRoles}><StudentAssessmentResultPage /></ProtectedRoute>} />
        <Route path="/student/leaderboard" element={<ProtectedRoute allowedRoles={studentRoles}><StudentLeaderboardPage /></ProtectedRoute>} />
        <Route path="/student/opportunities" element={<ProtectedRoute allowedRoles={studentRoles}><StudentOpportunitiesPage /></ProtectedRoute>} />
        <Route path="/student/opportunities/:id" element={<ProtectedRoute allowedRoles={studentRoles}><StudentOpportunityDetailsPage /></ProtectedRoute>} />
        <Route path="/student/applications" element={<ProtectedRoute allowedRoles={studentRoles}><StudentApplicationsPage /></ProtectedRoute>} />
        <Route path="/industry/dashboard" element={<ProtectedRoute allowedRoles={['industry', 'admin']}><IndustryDashboardPage /></ProtectedRoute>} />
        <Route path="/industry/company" element={<ProtectedRoute allowedRoles={['industry', 'admin']}><IndustryCompanyPage /></ProtectedRoute>} />
        <Route path="/industry/candidates" element={<ProtectedRoute allowedRoles={['industry', 'admin']}><IndustryCandidatesPage /></ProtectedRoute>} />
        <Route path="/industry/applications" element={<ProtectedRoute allowedRoles={['industry', 'admin']}><IndustryApplicationsPage /></ProtectedRoute>} />
        <Route path="/industry/opportunities" element={<ProtectedRoute allowedRoles={['industry', 'admin']}><IndustryOpportunitiesPage /></ProtectedRoute>} />
        <Route path="/industry/opportunities/new" element={<ProtectedRoute allowedRoles={['industry', 'admin']}><IndustryOpportunityCreatePage /></ProtectedRoute>} />
        <Route path="/industry/opportunities/:id" element={<ProtectedRoute allowedRoles={['industry', 'admin']}><IndustryOpportunityDetailsPage /></ProtectedRoute>} />
        <Route path="/industry/matches/:opportunityId" element={<ProtectedRoute allowedRoles={['industry', 'admin']}><MatchExplanationPage /></ProtectedRoute>} />
        <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><FacultyDashboardPage /></ProtectedRoute>} />
        <Route path="/faculty/students" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><FacultyStudentsPage /></ProtectedRoute>} />
        <Route path="/faculty/analytics" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><FacultyAnalyticsPage /></ProtectedRoute>} />
        <Route path="/placement/dashboard" element={<ProtectedRoute allowedRoles={['placement', 'admin']}><PlacementDashboardPage /></ProtectedRoute>} />
        <Route path="/placement/students" element={<ProtectedRoute allowedRoles={['placement', 'admin']}><PlacementStudentsPage /></ProtectedRoute>} />
        <Route path="/placement/analytics" element={<ProtectedRoute allowedRoles={['placement', 'admin']}><PlacementAnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudentsPage /></ProtectedRoute>} />
        <Route path="/admin/student-approvals" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudentApprovalsPage /></ProtectedRoute>} />
        <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><AdminFacultyPage /></ProtectedRoute>} />
        <Route path="/admin/industry" element={<ProtectedRoute allowedRoles={['admin']}><AdminIndustryPage /></ProtectedRoute>} />
        <Route path="/admin/placement-cell" element={<ProtectedRoute allowedRoles={['admin']}><AdminPlacementCellPage /></ProtectedRoute>} />
        <Route path="/admin/jobs" element={<ProtectedRoute allowedRoles={['admin']}><AdminJobsPage /></ProtectedRoute>} />
        <Route path="/admin/internships" element={<ProtectedRoute allowedRoles={['admin']}><AdminInternshipsPage /></ProtectedRoute>} />
        <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={['admin']}><AdminApplicationsPage /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLogsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
        <Route path="/unauthorized" element={<div className="p-8 text-center">Unauthorized access.</div>} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;
