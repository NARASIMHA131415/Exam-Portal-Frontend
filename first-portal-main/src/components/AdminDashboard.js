// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Form, Button, Alert, Modal, Table } from 'react-bootstrap';
import apiService from '../services/api';

// ══════════════════════════════════════════════════════════════
// ADMIN SIDEBAR COMPONENT
// ══════════════════════════════════════════════════════════════
const AdminSidebar = ({ active, onLogout }) => {
  const navigate = useNavigate();

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/admin' },
    { key: 'create', label: 'Create Exam', icon: '➕', path: '/admin/create' },
    { key: 'exams', label: 'Manage Exams', icon: '📝', path: '/admin/exams' },
    { key: 'students', label: 'Student Accounts', icon: '👥', path: '/admin/students' },
    { key: 'results', label: 'View Results', icon: '📊', path: '/admin/results' },
    { key: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
  ];

  return (
    <div className="sidebar">
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
          Admin Panel
        </h2>
        <span style={{ color: '#CE93D8', fontSize: 11 }}>ExamPortal</span>
      </div>

      <div style={{ padding: '16px 0', flex: 1 }}>
        {menuItems.map(item => (
          <div
            key={item.key}
            className={`sidebar-item ${active === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 24px', margin: '4px 12px', borderRadius: 10,
              cursor: 'pointer',
              color: active === item.key ? '#fff' : 'rgba(255,255,255,0.7)',
              background: active === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
              fontWeight: active === item.key ? 600 : 400,
              fontSize: 14, transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 24px', borderRadius: 10, cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)', fontSize: 14, transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: 18 }}>🚪</span>
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD HOME
// ══════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const admin = apiService.getUser();
  const adminEmail = admin?.email || 'Admin';
  const adminInitial = admin?.name ? admin.name.charAt(0).toUpperCase() : 'A';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [examsData, resultsData] = await Promise.all([
        apiService.getExams(),
        apiService.getAdminResults().catch(() => ({ results: [] }))
      ]);
      
      setExams(examsData.exams || examsData || []);
      setResults(resultsData.results || resultsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
  };

  const activeExamsCount = exams.filter(e => {
    if (!e.deadline) return true;
    return new Date(e.deadline) > new Date();
  }).length;

  const avgScore = results.length > 0 
    ? (results.reduce((sum, r) => sum + (r.score / r.total_questions * 100), 0) / results.length).toFixed(1)
    : '—';

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <AdminSidebar active="dashboard" onLogout={handleLogout} />
        <div className="dashboard-main">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar active="dashboard" onLogout={handleLogout} />
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h3>Admin Dashboard</h3>
          <div className="user-info">
            <div style={{ fontSize: 13, color: '#7B1FA2', fontWeight: 500 }}>{adminEmail}</div>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
              {adminInitial}
            </div>
          </div>
        </div>

        {error && <Alert variant="danger" style={{ borderRadius: 10 }}>{error}</Alert>}

        <Row className="g-4 mb-4">
          <Col md={6} lg={3}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E3F2FD' }}>📝</div>
              <h5>Total Exams</h5>
              <h2>{exams.length}</h2>
            </div>
          </Col>
          <Col md={6} lg={3}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E8F5E9' }}>✅</div>
              <h5>Active Exams</h5>
              <h2>{activeExamsCount}</h2>
            </div>
          </Col>
          <Col md={6} lg={3}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FFF3E0' }}>👥</div>
              <h5>Submissions</h5>
              <h2>{results.length}</h2>
            </div>
          </Col>
          <Col md={6} lg={3}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#F3E5F5' }}>📊</div>
              <h5>Avg Score</h5>
              <h2>{avgScore}{avgScore !== '—' ? '%' : ''}</h2>
            </div>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={6}>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/create')}>
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: '#E8F5E9', marginBottom: 0 }}>➕</div>
                <div>
                  <h5 style={{ margin: 0, color: '#2D0040', fontWeight: 700 }}>Create New Exam</h5>
                  <p style={{ margin: 0, color: '#888', fontSize: 13 }}>Upload PDF and set answer key</p>
                </div>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/exams')}>
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: '#FFF3E0', marginBottom: 0 }}>📋</div>
                <div>
                  <h5 style={{ margin: 0, color: '#2D0040', fontWeight: 700 }}>Manage Exams</h5>
                  <p style={{ margin: 0, color: '#888', fontSize: 13 }}>View and edit existing exams</p>
                </div>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/results')}>
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: '#E3F2FD', marginBottom: 0 }}>📈</div>
                <div>
                  <h5 style={{ margin: 0, color: '#2D0040', fontWeight: 700 }}>View Results</h5>
                  <p style={{ margin: 0, color: '#888', fontSize: 13 }}>Check student submissions</p>
                </div>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/settings')}>
              <div className="d-flex align-items-center gap-3">
                <div className="stat-icon" style={{ background: '#F3E5F5', marginBottom: 0 }}>⚙️</div>
                <div>
                  <h5 style={{ margin: 0, color: '#2D0040', fontWeight: 700 }}>Settings</h5>
                  <p style={{ margin: 0, color: '#888', fontSize: 13 }}>Configure portal settings</p>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {exams.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h5 style={{ color: '#2D0040', fontWeight: 700, marginBottom: 16 }}>Recent Exams</h5>
            <div className="create-exam-card">
              <Table responsive hover style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{ background: '#F8F0FB' }}>
                    <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Title</th>
                    <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Duration</th>
                    <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Questions</th>
                    <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Status</th>
                    <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.slice(0, 5).map((exam) => {
                    const isActive = !exam.deadline || new Date(exam.deadline) > new Date();
                    return (
                      <tr key={exam.id}>
                        <td style={{ padding: 12, fontWeight: 500 }}>{exam.title}</td>
                        <td style={{ padding: 12 }}>{exam.duration} min</td>
                        <td style={{ padding: 12 }}>{exam.total_questions || 'N/A'}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: isActive ? '#e8f5e9' : '#ffebee',
                            color: isActive ? '#2e7d32' : '#c62828',
                          }}>
                            {isActive ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td style={{ padding: 12, fontSize: 13, color: '#888' }}>
                          {new Date(exam.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// CREATE EXAM PAGE
// ══════════════════════════════════════════════════════════════
const CreateExam = () => {
  const navigate = useNavigate();
  const admin = apiService.getUser();
  const adminEmail = admin?.email || 'Admin';
  const adminInitial = admin?.name ? admin.name.charAt(0).toUpperCase() : 'A';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [tempDeadline, setTempDeadline] = useState('');
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    apiService.logout();
  };

  const openDeadlinePicker = () => {
    setTempDeadline(deadline);
    setShowDeadlineModal(true);
  };

  const confirmDeadline = () => {
    setDeadline(tempDeadline);
    setShowDeadlineModal(false);
  };

  const clearDeadline = () => {
    setDeadline('');
    setTempDeadline('');
    setShowDeadlineModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter exam title');
      return;
    }

    if (!totalQuestions || totalQuestions < 1) {
      setError('Please enter valid number of questions');
      return;
    }

    if (!duration || duration < 1) {
      setError('Please enter valid duration');
      return;
    }

    setLoading(true);

    try {
      const examData = {
        title: title.trim(),
        description: description.trim() || null,
        total_questions: parseInt(totalQuestions),
        duration: parseInt(duration),
        deadline: deadline || null,
      };

      // Call API to create exam (you'll need to implement this endpoint)
      const response = await apiService.request('/api/admin/exams/create', {
        method: 'POST',
        body: JSON.stringify(examData),
      });

      setSuccess(true);
      
      // Reset form after 2 seconds and redirect
      setTimeout(() => {
        navigate('/admin/exams');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTotalQuestions('');
    setDuration('');
    setDeadline('');
    setSuccess(false);
    setError('');
  };

  const formatDeadlineDisplay = (dl) => {
    if (!dl) return '';
    return new Date(dl).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar active="create" onLogout={handleLogout} />
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h3>Create New Exam</h3>
          <div className="user-info">
            <div style={{ fontSize: 13, color: '#7B1FA2', fontWeight: 500 }}>{adminEmail}</div>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
              {adminInitial}
            </div>
          </div>
        </div>

        {success ? (
          <div className="create-exam-card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h4 style={{ color: '#2D0040', fontWeight: 700, marginBottom: 8 }}>Exam Created Successfully!</h4>
            <p style={{ color: '#888', marginBottom: 24 }}>Redirecting to exam management...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger" style={{ borderRadius: 10 }}>{error}</Alert>}

            <Row className="g-4">
              <Col lg={8}>
                <div className="create-exam-card">
                  <h5 style={{ color: '#2D0040', fontWeight: 700, marginBottom: 24 }}>Exam Details</h5>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">Exam Title</Form.Label>
                    <Form.Control
                      type="text"
                      className="form-input-custom"
                      placeholder="e.g., Data Structures Mid-Term"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-custom">Description (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      className="form-input-custom"
                      placeholder="Brief description of the exam..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={loading}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="form-label-custom">Total Questions</Form.Label>
                        <Form.Control
                          type="number"
                          className="form-input-custom"
                          min="1"
                          max="200"
                          placeholder="e.g., 50"
                          value={totalQuestions}
                          onChange={(e) => setTotalQuestions(e.target.value)}
                          disabled={loading}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="form-label-custom">Duration (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          className="form-input-custom"
                          min="5"
                          max="300"
                          placeholder="e.g., 60"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          disabled={loading}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-custom">Deadline (Optional)</Form.Label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {deadline ? (
                        <div style={{
                          flex: 1,
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: '1.5px solid #4caf50',
                          background: '#f1f8e9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
                              Deadline Set
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#2D0040' }}>
                              {formatDeadlineDisplay(deadline)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={openDeadlinePicker}
                              style={{ borderRadius: 8, fontWeight: 600, fontSize: 12 }}
                              disabled={loading}
                            >
                              Change
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={clearDeadline}
                              style={{ borderRadius: 8, fontWeight: 600, fontSize: 12 }}
                              disabled={loading}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline-secondary"
                          onClick={openDeadlinePicker}
                          disabled={loading}
                          style={{
                            borderRadius: 10,
                            padding: '12px 24px',
                            fontWeight: 600,
                            width: '100%',
                            border: '1.5px dashed #E1BEE7',
                            color: '#888',
                            background: '#fafafa',
                          }}
                        >
                          📅 Click to Set Deadline
                        </Button>
                      )}
                    </div>
                    <Form.Text style={{ color: '#888', fontSize: 11 }}>
                      Leave empty for no deadline
                    </Form.Text>
                  </Form.Group>
                </div>
              </Col>

              <Col lg={4}>
                <div className="exam-preview-box">
                  <h6 style={{ color: '#2D0040', fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>
                    Exam Preview
                  </h6>
                  <Row>
                    <Col xs={6}>
                      <div className="preview-item">
                        <div className="preview-value">{totalQuestions || '—'}</div>
                        <div className="preview-label">Questions</div>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="preview-item">
                        <div className="preview-value">{duration || '—'} {duration && 'min'}</div>
                        <div className="preview-label">Duration</div>
                      </div>
                    </Col>
                  </Row>

                  {deadline && (
                    <div style={{
                      marginTop: 16,
                      padding: 12,
                      background: '#f1f8e9',
                      borderRadius: 10,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
                        Deadline
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32' }}>
                        {formatDeadlineDisplay(deadline)}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!title || !totalQuestions || !duration || loading}
                    style={{
                      width: '100%',
                      marginTop: 24,
                      background: 'linear-gradient(135deg, #2D0040, #5B0A7B)',
                      border: 'none',
                      borderRadius: 10,
                      padding: 14,
                      fontWeight: 700,
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Exam'}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        )}

        {/* Deadline Picker Modal */}
        <Modal show={showDeadlineModal} onHide={() => setShowDeadlineModal(false)} centered>
          <Modal.Body style={{ padding: 0 }}>
            <div style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
              <h5 style={{ fontWeight: 700, color: '#2D0040', marginBottom: 4 }}>Set Exam Deadline</h5>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
                Choose the date and time when this exam expires
              </p>

              <Form.Control
                type="datetime-local"
                value={tempDeadline}
                onChange={(e) => setTempDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '2px solid #E1BEE7',
                  fontSize: 16,
                  fontWeight: 500,
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              />

              {tempDeadline && (
                <div style={{
                  background: '#F8F0FB',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 20,
                  fontSize: 14,
                  color: '#5B0A7B',
                  fontWeight: 500,
                }}>
                  Selected: {formatDeadlineDisplay(tempDeadline)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowDeadlineModal(false)}
                  style={{ borderRadius: 10, padding: '10px 28px', fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={clearDeadline}
                  style={{ borderRadius: 10, padding: '10px 28px', fontWeight: 600 }}
                >
                  No Deadline
                </Button>
                <Button
                  onClick={confirmDeadline}
                  disabled={!tempDeadline}
                  style={{
                    borderRadius: 10,
                    padding: '10px 28px',
                    fontWeight: 700,
                    background: '#5B0A7B',
                    border: 'none',
                    fontSize: 15,
                  }}
                >
                  ✓ OK — Set Deadline
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MANAGE EXAMS PAGE
// ══════════════════════════════════════════════════════════════
const ManageExams = () => {
  const navigate = useNavigate();
  const admin = apiService.getUser();
  const adminEmail = admin?.email || 'Admin';
  const adminInitial = admin?.name ? admin.name.charAt(0).toUpperCase() : 'A';

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await apiService.getExams();
      setExams(data.exams || data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
  };

  const confirmDelete = async () => {
    if (!examToDelete) return;

    try {
      // Call API to delete exam (you'll need to implement this endpoint)
      await apiService.request(`/api/admin/exams/${examToDelete.id}`, {
        method: 'DELETE',
      });
      
      // Refresh exams list
      fetchExams();
      setShowDeleteModal(false);
      setExamToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete exam');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <AdminSidebar active="exams" onLogout={handleLogout} />
        <div className="dashboard-main">
          <div className="loading">Loading exams...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar active="exams" onLogout={handleLogout} />
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h3>Manage Exams</h3>
          <div className="user-info">
            <div style={{ fontSize: 13, color: '#7B1FA2', fontWeight: 500 }}>{adminEmail}</div>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
              {adminInitial}
            </div>
          </div>
        </div>

        {error && <Alert variant="danger" style={{ borderRadius: 10 }}>{error}</Alert>}

        {!exams.length ? (
          <div className="create-exam-card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
            <h4 style={{ color: '#2D0040', fontWeight: 700, marginBottom: 8 }}>No Exams Created Yet</h4>
            <p style={{ color: '#888', marginBottom: 24 }}>Create your first exam to get started</p>
            <Button
              onClick={() => navigate('/admin/create')}
              style={{
                background: 'linear-gradient(135deg, #5B0A7B, #7B1FA2)',
                border: 'none',
                borderRadius: 10,
                padding: '12px 32px',
                fontWeight: 600,
              }}
            >
              Create Exam
            </Button>
          </div>
        ) : (
          <div className="create-exam-card">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <h5 style={{ margin: 0, color: '#2D0040', fontWeight: 700 }}>
                All Exams ({exams.length})
              </h5>
              <Button
                onClick={() => navigate('/admin/create')}
                style={{
                  background: '#5B0A7B',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 20px',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                + New Exam
              </Button>
            </div>

            <Table responsive hover>
              <thead>
                <tr style={{ background: '#F8F0FB' }}>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Title</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Questions</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Duration</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Deadline</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Status</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => {
                  const isActive = !exam.deadline || new Date(exam.deadline) > new Date();
                  return (
                    <tr key={exam.id}>
                      <td style={{ padding: 12, fontWeight: 500 }}>{exam.title}</td>
                      <td style={{ padding: 12 }}>{exam.total_questions}</td>
                      <td style={{ padding: 12 }}>{exam.duration} min</td>
                      <td style={{ padding: 12, fontSize: 13 }}>
                        {exam.deadline
                          ? new Date(exam.deadline).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: isActive ? '#e8f5e9' : '#ffebee',
                          color: isActive ? '#2e7d32' : '#c62828',
                        }}>
                          {isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => {
                            setExamToDelete(exam);
                            setShowDeleteModal(true);
                          }}
                          style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontWeight: 700, fontSize: 18 }}>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this exam?</p>
          {examToDelete && (
            <div style={{ background: '#F8F0FB', padding: 16, borderRadius: 10 }}>
              <strong>{examToDelete.title}</strong>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                {examToDelete.total_questions} questions • {examToDelete.duration} minutes
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteModal(false)}
            style={{ borderRadius: 8 }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} style={{ borderRadius: 8 }}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// VIEW RESULTS PAGE
// ══════════════════════════════════════════════════════════════
const ViewResults = () => {
  const navigate = useNavigate();
  const admin = apiService.getUser();
  const adminEmail = admin?.email || 'Admin';
  const adminInitial = admin?.name ? admin.name.charAt(0).toUpperCase() : 'A';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      // You'll need to implement an admin endpoint to get all results
      const data = await apiService.request('/api/admin/results');
      setResults(data.results || data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <AdminSidebar active="results" onLogout={handleLogout} />
        <div className="dashboard-main">
          <div className="loading">Loading results...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar active="results" onLogout={handleLogout} />
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h3>Student Results</h3>
          <div className="user-info">
            <div style={{ fontSize: 13, color: '#7B1FA2', fontWeight: 500 }}>{adminEmail}</div>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
              {adminInitial}
            </div>
          </div>
        </div>

        {error && <Alert variant="danger" style={{ borderRadius: 10 }}>{error}</Alert>}

        {!results.length ? (
          <div className="create-exam-card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
            <h4 style={{ color: '#2D0040', fontWeight: 700, marginBottom: 8 }}>No Results Yet</h4>
            <p style={{ color: '#888' }}>Student submissions will appear here</p>
          </div>
        ) : (
          <div className="create-exam-card">
            <h5 style={{ margin: 0, color: '#2D0040', fontWeight: 700, marginBottom: 20 }}>
              All Submissions ({results.length})
            </h5>
            <Table responsive hover>
              <thead>
                <tr style={{ background: '#F8F0FB' }}>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Student</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Exam</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Score</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Percentage</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Status</th>
                  <th style={{ fontWeight: 600, color: '#5B0A7B', padding: 12 }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => {
                  const percentage = ((result.score / result.total_questions) * 100).toFixed(2);
                  const passed = percentage >= 60;
                  
                  return (
                    <tr key={idx}>
                      <td style={{ padding: 12, fontWeight: 500 }}>{result.student_email}</td>
                      <td style={{ padding: 12 }}>{result.exam_title}</td>
                      <td style={{ padding: 12 }}>
                        {result.score} / {result.total_questions}
                      </td>
                      <td style={{ padding: 12, fontWeight: 600 }}>{percentage}%</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: passed ? '#e8f5e9' : '#ffebee',
                          color: passed ? '#2e7d32' : '#c62828',
                        }}>
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: '#888' }}>
                        {new Date(result.submitted_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════════
const AdminSettings = () => {
  const navigate = useNavigate();
  const admin = apiService.getUser();
  const adminEmail = admin?.email || 'Admin';
  const adminInitial = admin?.name ? admin.name.charAt(0).toUpperCase() : 'A';

  const [saved, setSaved] = useState(false);

  const handleLogout = () => {
    apiService.logout();
  };

  const handleSave = () => {
    // Implement settings save functionality
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar active="settings" onLogout={handleLogout} />
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h3>Settings</h3>
          <div className="user-info">
            <div style={{ fontSize: 13, color: '#7B1FA2', fontWeight: 500 }}>{adminEmail}</div>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
              {adminInitial}
            </div>
          </div>
        </div>

        {saved && (
          <Alert variant="success" style={{ borderRadius: 10, fontWeight: 600 }}>
            ✓ Settings saved successfully!
          </Alert>
        )}

        <div className="create-exam-card">
          <h5 style={{ color: '#2D0040', fontWeight: 700, marginBottom: 24 }}>
            Application Settings
          </h5>
          <p style={{ color: '#888', fontSize: 14 }}>
            Settings functionality will be implemented based on your requirements.
          </p>
          
          <Button
            onClick={handleSave}
            style={{
              marginTop: 20,
              background: 'linear-gradient(135deg, #2D0040, #5B0A7B)',
              border: 'none',
              borderRadius: 10,
              padding: '12px 32px',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export { AdminDashboard, CreateExam, ManageExams, ViewResults, AdminSettings, AdminSidebar };
export default AdminDashboard;