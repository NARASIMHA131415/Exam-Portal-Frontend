// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ExamPortal from './components/ExamPortal';
import ExamDashboard from './components/ExamDashboard';
import ResultPage from './components/ResultPage';
import CreateExam from './components/CreateExam';
import StudentManagement from './components/StudentManagement';
import { AdminDashboard, ManageExams, ViewResults, AdminSettings } from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import apiService from './services/api';
import './App.css';

function App() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // ✅ Check if user is authenticated by looking at localStorage directly
    const token = localStorage.getItem('jwt_token');
    const user = localStorage.getItem('user');
    
    console.log('🔍 App.js - Authentication Check:');
    console.log('  - Token in localStorage:', !!token);
    console.log('  - User in localStorage:', !!user);
    
    if (token && user) {
      const userData = JSON.parse(user);
      console.log('✅ User authenticated - Role:', userData?.role);
    } else {
      console.log('❌ No user authenticated');
    }
    
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/login" element={<LoginPage />} />

          {/* STUDENT ROUTES */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result/:attemptId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ResultPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <CreateExam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <ManageExams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <ViewResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <StudentManagement />
              </ProtectedRoute>
            }
          />

          {/* DEFAULT HOME ROUTE */}
          <Route
            path="/"
            element={
              (() => {
                // ✅ Check authentication directly from localStorage
                const token = localStorage.getItem('jwt_token');
                const user = localStorage.getItem('user');
                
                if (token && user) {
                  try {
                    const userData = JSON.parse(user);
                    const role = userData?.role;
                    
                    console.log('🏠 Home route - User authenticated, redirecting to:', role);
                    
                    if (role === 'admin' || role === 'super_admin') {
                      return <Navigate to="/admin" replace />;
                    } else if (role === 'student') {
                      return <Navigate to="/dashboard" replace />;
                    }
                  } catch (e) {
                    console.error('Error parsing user data:', e);
                  }
                }
                
                console.log('🏠 Home route - No user, redirecting to login');
                return <Navigate to="/login" replace />;
              })()
            }
          />

          {/* 404 ROUTE */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
