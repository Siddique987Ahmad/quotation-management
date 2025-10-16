// routes/index.tsx - Updated with ClientsPage
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import DashboardPage from "../pages/DashboardPage";
import UsersPage from "../pages/Users/UsersPage";
import ClientsPage from "../pages/Clients/ClientsPage"; // Add this import
import QuotationsPage from "../pages/Quotations/QuotationsPage";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import { isAuthenticated } from "../utils/auth";
import InvoicesPage from "../pages/Invoices/InvoicesPage";
import { Role } from "../types";
import SystemSettingsPage from "../pages/SystemSettings/SystemSettingsPage";
import EmailTemplates from "../pages/EmailTemplate/EmailTemplates";
import ProfilePage from "../pages/ProfilePage";
import RolePermissionManagement from "../pages/RolePermissionManagement";
// import UserPermissionManagement from '../pages/UserPermissions';

const AppRoutes: React.FC = () => {
  const isAuth = isAuthenticated();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Protected Routes with unified structure */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* Dashboard - Everyone has access */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Clients - Employees (USER role) and above can access */}
        <Route
          path="clients"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "clients", action: "read" }]}
            >
              <ClientsPage />
            </ProtectedRoute>
          }
        />

        {/* Create Client - Users with create permission can create new clients */}
        <Route
          path="clients/create"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "clients", action: "create" }]}
            >
              <ClientsPage />
            </ProtectedRoute>
          }
        />

        {/* View Client Details - Users with read permission can view client details */}
        <Route
          path="clients/:id"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "clients", action: "read" }]}
            >
              <ClientsPage />
            </ProtectedRoute>
          }
        />

        {/* Edit Client - Users with update permission can edit clients */}
        {/* Note: This route supports both /clients/:id/edit and /clients/:id?edit=true */}
        <Route
          path="clients/:id/edit"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "clients", action: "update" }]}
            >
              <ClientsPage />
            </ProtectedRoute>
          }
        />

        {/* Quotations - Employees (USER role) and above can access */}
        <Route
          path="quotations"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "quotations", action: "read" }]}
            >
              <QuotationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="quotations/create"
          element={
            <ProtectedRoute
              requiredPermissions={[
                { resource: "quotations", action: "create" },
              ]}
            >
              <QuotationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="quotations/:id"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "quotations", action: "read" }]}
            >
              <QuotationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="quotations/:id/edit"
          element={
            <ProtectedRoute
              requiredPermissions={[
                { resource: "quotations", action: "update" },
              ]}
            >
              <QuotationsPage />
            </ProtectedRoute>
          }
        />

        {/* Invoices - Everyone can view their own */}
        <Route
          path="invoices"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "invoices", action: "read" }]}
            >
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="invoices/create"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "invoices", action: "create" }]}
            >
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="invoices/:id"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "invoices", action: "read" }]}
            >
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="invoices/:id/edit"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "invoices", action: "update" }]}
            >
              <InvoicesPage />
            </ProtectedRoute>
          }
        />

        {/* Reports - Managers and above only */}
        {/* <Route path="reports" element={
          <ProtectedRoute requiredRole="MANAGER">
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="reports/:type" element={
          <ProtectedRoute requiredRole="MANAGER">
            <ReportsPage />
          </ProtectedRoute>
        } /> */}

        {/* User/Employee Management - Admins only */}
        <Route
          path="users"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "users", action: "read" }]}
            >
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Create User - Only Admins can create new users */}
        <Route
          path="users/create"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "users", action: "create" }]}
            >
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* View User Details - Admins and Managers can view user details */}
        <Route
          path="users/:id"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "users", action: "read" }]}
            >
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Edit User - Only Admins can edit users */}
        {/* Note: This route supports both /users/:id/edit and /users/:id?edit=true */}
        <Route
          path="users/:id/edit"
          element={
            <ProtectedRoute
              requiredPermissions={[{ resource: "users", action: "update" }]}
            >
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* <Route path="users/permissions/available" element={
          <ProtectedRoute requiredPermissions={[{ resource: 'users', action: 'manage_permissions' }]}>
            <UserPermissionManagement />
          </ProtectedRoute>
        } /> */}

        {/* Settings - Admins only */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/general"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/email"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="settings/role-permissions"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <RolePermissionManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="settings/email-templates"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <EmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/email-templates/create"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <EmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/email-templates/:templateKey"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <EmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/email-templates/:templateKey/edit"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <EmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/email-templates/:templateKey/preview"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <EmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/email-templates/category/:category"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <EmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/tax"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/invoice"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/notifications"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/security"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Root redirect */}
      <Route
        path="*"
        element={<Navigate to={isAuth ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
