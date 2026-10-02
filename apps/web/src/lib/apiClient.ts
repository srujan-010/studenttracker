import axios from 'axios';
import {
  ApiResponse,
  DashboardSummaryDTO,
  StudentDTO,
  PredictionResult,
  InterventionDTO,
  NotificationDTO,
  AuditLogDTO,
  SystemRiskThresholds,
  UserDTO,
  FeatureInputs,
} from '@eduguard/shared';

const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    // In standalone local dev (localhost:3000), route to Express API port 5000
    if (window.location.hostname === 'localhost' && window.location.port === '3000') {
      return 'http://localhost:5000/api';
    }
    // On Vercel deployments and vercel dev proxy, route to same-origin /api
    return '/api';
  }
  // Server-side: use Vercel service binding API_SERVICE_URL if present
  if (process.env.API_SERVICE_URL) {
    return `${process.env.API_SERVICE_URL.replace(/\/$/, '')}/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('eduguard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle unauthenticated 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('eduguard_token');
        localStorage.removeItem('eduguard_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: UserDTO }>>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('eduguard_token');
      localStorage.removeItem('eduguard_user');
    }
  },
  getMe: async () => {
    const res = await api.get<ApiResponse<UserDTO>>('/auth/me');
    return res.data;
  },
};

export const dashboardApi = {
  getSummary: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<DashboardSummaryDTO>>('/dashboard/summary', { params });
    return res.data;
  },
};

export const studentsApi = {
  getStudents: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<StudentDTO[]>>('/students', { params });
    return res.data;
  },
  getStudentById: async (id: string) => {
    const res = await api.get<ApiResponse<any>>(`/students/${id}`);
    return res.data;
  },
  getMyProfile: async () => {
    const res = await api.get<ApiResponse<any>>('/students/me');
    return res.data;
  },
  createStudent: async (data: any) => {
    const res = await api.post<ApiResponse<StudentDTO>>('/students', data);
    return res.data;
  },
  updateStudent: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<StudentDTO>>(`/students/${id}`, data);
    return res.data;
  },
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<any>>('/students/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const predictionsApi = {
  generate: async (studentId: string, features?: FeatureInputs) => {
    const res = await api.post<ApiResponse<PredictionResult>>('/predictions', {
      studentId,
      features,
    });
    return res.data;
  },
  getPredictions: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PredictionResult[]>>('/predictions', { params });
    return res.data;
  },
};

export const academicApi = {
  getRecords: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any[]>>('/academic-records', { params });
    return res.data;
  },
  upsertRecord: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/academic-records', data);
    return res.data;
  },
};

export const interventionsApi = {
  getInterventions: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<InterventionDTO[]>>('/interventions', { params });
    return res.data;
  },
  createIntervention: async (data: any) => {
    const res = await api.post<ApiResponse<InterventionDTO>>('/interventions', data);
    return res.data;
  },
  updateIntervention: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<InterventionDTO>>(`/interventions/${id}`, data);
    return res.data;
  },
};

export const teachersApi = {
  getTeachers: async () => {
    const res = await api.get<ApiResponse<any[]>>('/teachers');
    return res.data;
  },
  createTeacher: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/teachers', data);
    return res.data;
  },
};

export const classesApi = {
  getClasses: async () => {
    const res = await api.get<ApiResponse<any[]>>('/classes');
    return res.data;
  },
  createClass: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/classes', data);
    return res.data;
  },
};

export const subjectsApi = {
  getSubjects: async (params?: any) => {
    const res = await api.get<ApiResponse<any[]>>('/subjects', { params });
    return res.data;
  },
  createSubject: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/subjects', data);
    return res.data;
  },
};

export const notificationsApi = {
  getNotifications: async () => {
    const res = await api.get<ApiResponse<{ notifications: NotificationDTO[]; unreadCount: number }>>(
      '/notifications'
    );
    return res.data;
  },
  markAsRead: async (id: string) => {
    const res = await api.put<ApiResponse<NotificationDTO>>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.put<ApiResponse<any>>('/notifications/read-all');
    return res.data;
  },
};

export const auditLogsApi = {
  getAuditLogs: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<AuditLogDTO[]>>('/audit-logs', { params });
    return res.data;
  },
};

export const settingsApi = {
  getSettings: async () => {
    const res = await api.get<ApiResponse<any>>('/settings');
    return res.data;
  },
  updateThresholds: async (thresholds: Partial<SystemRiskThresholds> & { institutionName?: string }) => {
    const res = await api.put<ApiResponse<any>>('/settings/thresholds', thresholds);
    return res.data;
  },
};

export const reportsApi = {
  getStudentReport: async (studentId: string) => {
    const res = await api.get<ApiResponse<any>>(`/reports/students/${studentId}`);
    return res.data;
  },
  getClassRiskReport: async (params?: any) => {
    const res = await api.get<ApiResponse<any>>('/reports/class-risk', { params });
    return res.data;
  },
};

export const attendanceApi = {
  getAttendance: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any[]>>('/attendance', { params });
    return res.data;
  },
  getSheet: async (
    paramsOrClassId: string | Record<string, any>,
    date?: string,
    subjectId?: string
  ) => {
    const params =
      typeof paramsOrClassId === 'string'
        ? { classId: paramsOrClassId, date, subjectId }
        : paramsOrClassId;
    const res = await api.get<ApiResponse<any>>('/attendance/sheet', { params });
    return res.data;
  },
  saveBatch: async (data: { classId?: string; subjectId: string; date: string; records: { studentId: string; status: string }[] }) => {
    const res = await api.post<ApiResponse<any>>('/attendance/batch', data);
    return res.data;
  },
  updateRecord: async (id: string, data: { status?: string; date?: string }) => {
    const res = await api.put<ApiResponse<any>>(`/attendance/${id}`, data);
    return res.data;
  },
};

export const assessmentsApi = {
  getAssessments: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any[]>>('/assessments', { params });
    return res.data;
  },
  createAssessment: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/assessments', data);
    return res.data;
  },
  saveBatch: async (data: {
    subjectId: string;
    semester: number;
    academicYear?: string;
    assessmentType: string;
    maximumMarks: number;
    records: { studentId: string; obtainedMarks: number; notes?: string }[];
  }) => {
    const res = await api.post<ApiResponse<any>>('/assessments/batch', data);
    return res.data;
  },
  updateAssessment: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<any>>(`/assessments/${id}`, data);
    return res.data;
  },
  deleteAssessment: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/assessments/${id}`);
    return res.data;
  },
};

export const programsApi = {
  getPrograms: async () => {
    const res = await api.get<ApiResponse<any[]>>('/programs');
    return res.data;
  },
  createProgram: async (data: {
    name: string;
    code: string;
    durationYears: number;
    totalSemesters: number;
    departments?: string[];
  }) => {
    const res = await api.post<ApiResponse<any>>('/programs', data);
    return res.data;
  },
  deleteProgram: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/programs/${id}`);
    return res.data;
  },
};

export const departmentsApi = {
  getDepartments: async (params?: { program?: string }) => {
    const res = await api.get<ApiResponse<any[]>>('/departments', { params });
    return res.data;
  },
  createDepartment: async (data: { name: string; code: string; program: string }) => {
    const res = await api.post<ApiResponse<any>>('/departments', data);
    return res.data;
  },
  deleteDepartment: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/departments/${id}`);
    return res.data;
  },
};

export const assignmentsApi = {
  getAssignments: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any[]>>('/assignments', { params });
    return res.data;
  },
  createAssignment: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/assignments', data);
    return res.data;
  },
  getSubmissions: async (id: string) => {
    const res = await api.get<ApiResponse<any[]>>(`/assignments/${id}/submissions`);
    return res.data;
  },
  updateSubmissionStatus: async (data: { assignmentId: string; studentId: string; status: string; obtainedMarks?: number; notes?: string }) => {
    const res = await api.post<ApiResponse<any>>('/assignments/submissions/status', data);
    return res.data;
  },
  submitMyAssignment: async (id: string, data: { notes?: string }) => {
    const res = await api.post<ApiResponse<any>>(`/assignments/${id}/submit`, data);
    return res.data;
  },
};

export const studyLogsApi = {
  getStudyLogs: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any>>('/study-logs', { params });
    return res.data;
  },
  createStudyLog: async (data: { studentId?: string; subjectId?: string; date?: string; hours: number; topicsCovered?: string; notes?: string }) => {
    const res = await api.post<ApiResponse<any>>('/study-logs', data);
    return res.data;
  },
  deleteStudyLog: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/study-logs/${id}`);
    return res.data;
  },
};

export const participationApi = {
  getParticipation: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<any[]>>('/participation', { params });
    return res.data;
  },
  getSheet: async (classId: string, date: string, subjectId?: string) => {
    const res = await api.get<ApiResponse<any>>('/participation/sheet', {
      params: { classId, date, subjectId },
    });
    return res.data;
  },
  saveBatch: async (data: { classId?: string; subjectId: string; date: string; records: { studentId: string; obtainedScore: number; maximumScore?: number; notes?: string }[] }) => {
    const res = await api.post<ApiResponse<any>>('/participation/batch', data);
    return res.data;
  },
};

