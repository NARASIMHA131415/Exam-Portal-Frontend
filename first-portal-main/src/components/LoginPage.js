// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import apiService from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    console.log('🔄 Attempting login...');
    
    // Call login API
    const response = await apiService.login(email.trim().toLowerCase(), password);
    
    console.log('✅ Login successful!');
    console.log('✅ User role:', response.user?.role);
    
    const userRole = response.user?.role;
    
    // Navigate after short delay
    setTimeout(() => {
      if (userRole === 'super_admin' || userRole === 'admin') {
        console.log('↗️ Navigating to /admin');
        navigate('/admin', { replace: true });
      } else if (userRole === 'student') {
        console.log('↗️ Navigating to /dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }, 200);

  } catch (err) {
    console.error('❌ Login error:', err);
    setError(err.message || 'Invalid email or password. Please try again.');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="login-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="login-card" style={{
        background: '#fff',
        borderRadius: 16,
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            fontSize: 28,
            color: '#fff',
            fontWeight: 700
          }}>
            EP
          </div>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: 8, fontWeight: 700, color: '#1a1a2e' }}>
          Welcome Back
        </h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: 24, fontSize: 14 }}>
          Online Examination Platform
        </p>

        {/* Error Alert */}
        {error && (
          <Alert 
            variant="danger" 
            dismissible 
            onClose={() => setError('')}
            style={{ borderRadius: 10, marginBottom: 20 }}
          >
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Form onSubmit={handleSubmit}>
          {/* Email Field */}
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: 14, color: '#555' }}>
              Email Address
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="admin@examportal.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                borderRadius: 10,
                padding: '12px 16px',
                border: '1.5px solid #e0e0e0',
                fontSize: 14
              }}
            />
          </Form.Group>

          {/* Password Field */}
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: 14, color: '#555' }}>
              Password
            </Form.Label>
            <div style={{ position: 'relative' }}>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="SuperAdmin@123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  borderRadius: 10,
                  padding: '12px 16px',
                  paddingRight: 45,
                  border: '1.5px solid #e0e0e0',
                  fontSize: 14
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </Form.Group>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
              marginTop: 16
            }}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </Form>

        {/* Demo Credentials */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#f8f9fa',
          borderRadius: 10,
          textAlign: 'center'
        }}>
          <strong style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 8 }}>
            Demo Credentials:
          </strong>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.8 }}>
          
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
