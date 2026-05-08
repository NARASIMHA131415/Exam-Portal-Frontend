// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import apiService from '../services/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // ✅ Check if user is authenticated
  const isAuthenticated = apiService.isAuthenticated();
  
  // ✅ Get current user
  const user = apiService.getUser();

  // ❌ Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('❌ Not authenticated - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // ✅ Authenticated but checking role permissions
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    
    console.log('✅ User role:', userRole, 'Allowed roles:', allowedRoles);
    
    // ❌ User role not in allowed roles
    if (!allowedRoles.includes(userRole)) {
      console.log('❌ User role not allowed - redirecting to home');
      
      // Redirect based on actual role
      if (userRole === 'admin' || userRole === 'super_admin') {
        return <Navigate to="/admin" replace />;
      } else if (userRole === 'student') {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/login" replace />;
      }
    }
  }

  // ✅ All checks passed - render children
  return children;
};

export default ProtectedRoute;
