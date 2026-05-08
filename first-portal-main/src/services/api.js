// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://exam-portal-backend-rzxz.onrender.com';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeader() {
    const token = localStorage.getItem('jwt_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const isFormData = options.body instanceof FormData;
    const defaultHeaders = {
      ...this.getAuthHeader(),
    };

    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.error || data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ══════════════════════════════════════════════════════════
  // AUTH APIs
  // ══════════════════════════════════════════════════════════

  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('jwt_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // ══════════════════════════════════════════════════════════
  // STUDENT DASHBOARD APIs
  // ══════════════════════════════════════════════════════════

  async getStudentDashboard() {
    return this.request('/api/student/dashboard');
  }

  async getStudentProfile() {
    return this.request('/api/student/profile');
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('/api/student/change-password', {
      method: 'POST',
      body: JSON.stringify({ 
        old_password: oldPassword, 
        new_password: newPassword 
      }),
    });
  }

  async getStatistics() {
    return this.request('/api/student/statistics');
  }

  // ══════════════════════════════════════════════════════════
  // EXAM APIs (Student)
  // ══════════════════════════════════════════════════════════

  async getExams() {
    const user = this.getUser();
    
    // Admin gets admin list
    if (user?.role === 'admin') {
      return this.request('/api/admin/exams/list');
    }
    
    // Students get available exams
    return this.request('/api/exam/available');
  }

  async getExamByCode(code) {
    return this.request(`/api/exam/by-code/${encodeURIComponent(code.trim().toUpperCase())}`);
  }

  async joinExam(examCode) {
    return this.request('/api/exam/join', {
      method: 'POST',
      body: JSON.stringify({ exam_code: examCode }),
    });
  }

  async getExamQuestions(examId) {
    return this.request(`/api/exam/${examId}/questions`);
  }

  async saveAnswer(examId, answerData) {
    return this.request(`/api/exam/${examId}/save-answer`, {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  }

  async submitExam(examId, answers) {
    return this.request(`/api/exam/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async checkTimer(examId) {
    return this.request(`/api/exam/${examId}/timer`);
  }

  // ══════════════════════════════════════════════════════════
  // RESULTS APIs
  // ══════════════════════════════════════════════════════════

  async getResult(attemptId) {
    return this.request(`/api/result/${attemptId}`);
  }

  async getUserResults() {
    return this.request('/api/student/results');
  }

  // ══════════════════════════════════════════════════════════
  // ADMIN DASHBOARD APIs
  // ══════════════════════════════════════════════════════════

  async getAdminDashboard() {
    return this.request('/api/admin/dashboard');
  }

  async getAdminExams() {
    return this.request('/api/admin/exams/list');
  }

  async createExamPDF(formData) {
    return this.request('/api/exams/create-with-pdf', {
      method: 'POST',
      body: formData,  // FormData with PDF
    });
  }

  async createExamDbMode(examData) {
    return this.request('/api/admin/exams/create', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  }

  async deleteExam(examId) {
    return this.request(`/api/admin/exams/${examId}`, {
      method: 'DELETE',
    });
  }

  async getAdminResults(examId = null) {
    const url = examId 
      ? `/api/admin/results/list?exam_id=${examId}`
      : '/api/admin/results/list';
    return this.request(url);
  }

  // ══════════════════════════════════════════════════════════
  // STUDENT MANAGEMENT APIs
  // ══════════════════════════════════════════════════════════

  async getStudents() {
    return this.request('/api/admin/students/list');
  }

  async createStudent(studentData) {
    return this.request('/api/admin/students/create', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(studentId, studentData) {
    return this.request(`/api/admin/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(studentId) {
    return this.request(`/api/admin/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateStudents(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/admin/students/bulk-create', {
      method: 'POST',
      body: formData,
    });
  }

  // ══════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ══════════════════════════════════════════════════════════

  isAuthenticated() {
    return !!localStorage.getItem('jwt_token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

export default new ApiService();
