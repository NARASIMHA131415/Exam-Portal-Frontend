// src/components/Sidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Sidebar = ({ active }) => {
  const navigate = useNavigate();
  const user = apiService.getUser();

  const handleLogout = () => {
    apiService.logout();
  };

  // Define menu items with icons
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { key: 'exams', label: 'Exams', path: '/exams', icon: '📝' },
    { key: 'results', label: 'Results', path: '/results', icon: '📊' },
  ];

  return (
    <div className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{
          color: '#fff',
          fontSize: 20,
          fontWeight: 700,
          margin: 0,
          letterSpacing: 1
        }}>
          ExamPortal
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 11,
          margin: '4px 0 0 0',
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          {user?.role === 'admin' ? 'Admin' : 'Student'}
        </p>
      </div>

      {/* Menu Items */}
      <div style={{ padding: '16px 0', flex: 1 }}>
        {menuItems.map(item => (
          <div
            key={item.key}
            className={`sidebar-item ${active === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 24px',
              margin: '4px 12px',
              borderRadius: 10,
              cursor: 'pointer',
              color: active === item.key ? '#fff' : 'rgba(255,255,255,0.7)',
              background: active === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
              fontWeight: active === item.key ? 600 : 400,
              fontSize: 14,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (active !== item.key)
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={e => {
              if (active !== item.key)
                e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* User Info Section */}
      <div style={{ 
        padding: '12px 20px', 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.email || ''}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div
          className="sidebar-item"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            transition: 'all 0.2s ease',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,0,0,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255,0,0,0.3)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
        >
          <span style={{ fontSize: 16 }}>🚪</span>
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 