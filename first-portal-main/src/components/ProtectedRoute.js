// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import apiService from '../services/api';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = apiService.isAuthenticated();
  const user = apiService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;