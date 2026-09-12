import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound/NotFound';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import WorkbenchPage from './pages/WorkbenchPage/WorkbenchPage';
import ChallengeMapPage from './pages/ChallengeMapPage/ChallengeMapPage';
import CoursePage from './pages/CoursePage/CoursePage';
import CoachingPage from './pages/CoachingPage/CoachingPage';
import NewcomersPage from './pages/NewcomersPage/NewcomersPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import QuizAdminPage from './pages/QuizAdminPage/QuizAdminPage';
import CourseAdminPage from './pages/CourseAdminPage/CourseAdminPage';
import DefensePage from './pages/DefensePage/DefensePage';
import TaskManagementPage from './pages/TaskManagementPage/TaskManagementPage';
import SystemSettingsPage from './pages/SystemSettingsPage/SystemSettingsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage/KnowledgeBasePage';
import KnowledgeBaseAdminPage from './pages/KnowledgeBaseAdminPage/KnowledgeBaseAdminPage';
import StageManagementPage from './pages/StageManagementPage/StageManagementPage';
import AdminManagementPage from './pages/AdminManagementPage/AdminManagementPage';
import DefenseAdminPage from './pages/DefenseAdminPage/DefenseAdminPage';
import LoginPage from './pages/LoginPage/LoginPage';
import AuthRequired from './components/AuthRequired';
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<AuthRequired />}>
      <Route path="change-password" element={<ChangePasswordPage />} />
      <Route element={<Layout />}>
        <Route index element={<WorkbenchPage />} />

        {/* 新人视角 */}
        <Route path="my-tasks" element={<ChallengeMapPage />} />
        <Route path="defense" element={<DefensePage />} />
        <Route path="course" element={<CoursePage />} />
        <Route path="knowledge-base" element={<KnowledgeBasePage />} />

        {/* 管理者视角 */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'read', subject: 'Dashboard' }]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="task-management"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Task' }]}>
              <TaskManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="newcomers"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Newcomer' }]}>
              <NewcomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="coaching"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Coaching' }]}>
              <CoachingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="quiz-admin"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Newcomer' }]}>
              <QuizAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="course-admin"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Newcomer' }]}>
              <CourseAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="knowledge-base-admin"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'KnowledgeBase' }]}>
              <KnowledgeBaseAdminPage />
            </ProtectedRoute>
          }
        />

        {/* 管理 */}
        <Route
          path="system-settings"

          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Permission' }]}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="stage-management"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Newcomer' }]}>
              <StageManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="defense-admin"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Newcomer' }]}>
              <DefenseAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin-management"
          element={
            <ProtectedRoute requiredPermissions={[{ action: 'manage', subject: 'Permission' }]}>
              <AdminManagementPage />
            </ProtectedRoute>
          }
        />

        {/* 兼容旧路径 */}
        <Route path="challenge-map" element={<Navigate to="/my-tasks" replace />} />
        <Route path="role-management" element={<Navigate to="/system-settings" replace />} />

        <Route path="unauthorized" element={<Unauthorized />} />
      </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
