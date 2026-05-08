// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import apiService from '../services/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // ✅ Check if user is authenticated
  const isAuthenticated = apiService.isAuthenticated();
  const user = apiService.getUser();
  const userRole = user?.role;

  console.log('🔐 ProtectedRoute Check:');
  console.log('  - isAuthenticated:', isAuthenticated);
  console.log('  - userRole:', userRole);
  console.log('  - allowedRoles:', allowedRoles);
  console.log('  - user:', user);

  // ❌ NOT AUTHENTICATED - Redirect to login
  if (!isAuthenticated || !user) {
    console.log('❌ Not authenticated - redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // ✅ Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      console.log('❌ Role not allowed - userRole:', userRole, 'allowedRoles:', allowedRoles);
      
      // Redirect to appropriate dashboard based on role
      if (userRole === 'admin' || userRole === 'super_admin') {
        console.log('↗️ Redirecting to /admin');
        return <Navigate to="/admin" replace />;
      } else if (userRole === 'student') {
        console.log('↗️ Redirecting to /dashboard');
        return <Navigate to="/dashboard" replace />;
      } else {
        console.log('↗️ Redirecting to /login (unknown role)');
        return <Navigate to="/login" replace />;
      }
    }
  }

  // ✅ All checks passed - render the component
  console.log('✅ Access granted - rendering component');
  return children;
};

export default ProtectedRoute;
