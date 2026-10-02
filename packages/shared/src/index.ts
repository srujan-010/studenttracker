// ==========================================================
// EduGuard AI - Shared Core Types, Interfaces & Constants
// ==========================================================

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';

export type InterventionType =
  | 'ACADEMIC_COUNSELING'
  | 'REMEDIAL_SUPPORT'
  | 'ASSIGNMENT_FOLLOWUP'
  | 'ATTENDANCE_FOLLOWUP'
  | 'STUDY_PLANNING'
  | 'FACULTY_MEETING'
  | 'OTHER';

export type InterventionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type InterventionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type NotificationType =
  | 'RISK_ALERT'
  | 'INTERVENTION_DUE'
  | 'PREDICTION_READY'
  | 'STUDENT_RISK_CHANGE'
  | 'SYSTEM';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  stats?: any;
  summary?: any;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface FeatureInputs {
  attendance: number;            // 0 - 100%
  previousScore: number;         // 0 - 100
  internalMarks: number;         // 0 - 100
  assignmentCompletion: number;  // 0 - 100%
  studyHours: number;            // Weekly hours, e.g. 0 - 40
  participation: number;         // 0 - 100%
}

export interface RiskFactor {
  factor: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  observedValue?: number;
  threshold?: number;
}

export interface SystemRiskThresholds {
  highRiskBelow: number;            // e.g. score < 50 => HIGH
  mediumRiskBelow: number;          // e.g. score < 70 => MEDIUM
  attendanceThreshold: number;      // e.g. < 75%
  previousScoreThreshold: number;   // e.g. < 55
  internalMarksThreshold: number;   // e.g. < 50
  assignmentCompletionThreshold: number; // e.g. < 70%
  studyHoursThreshold: number;      // e.g. < 8 hrs/week
  participationThreshold: number;   // e.g. < 50%
}

export const DEFAULT_RISK_THRESHOLDS: SystemRiskThresholds = {
  highRiskBelow: 50.0,
  mediumRiskBelow: 70.0,
  attendanceThreshold: 75.0,
  previousScoreThreshold: 55.0,
  internalMarksThreshold: 50.0,
  assignmentCompletionThreshold: 70.0,
  studyHoursThreshold: 8.0,
  participationThreshold: 50.0,
};

export interface PredictionResult {
  _id?: string;
  studentId: string;
  modelVersion: string;
  inputSnapshot: FeatureInputs;
  predictedScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  recommendations: string[];
  thresholdSnapshot: SystemRiskThresholds;
  createdBy?: string;
  createdAt: string | Date;
}

export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  status: UserStatus;
  lastLoginAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StudentDTO {
  _id: string;
  studentId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string | Date;
  program?: string;
  department: string;
  course: string;
  year: number;
  section: string;
  academicYear: string;
  semester: number;
  enrollmentDate?: string | Date;
  status: StudentStatus;
  profileImage?: string;
  latestPrediction?: PredictionResult;
  academicHistory?: StudentFullAcademicHistoryDTO;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TeacherDTO {
  _id: string;
  userId: string;
  user?: UserDTO;
  name?: string;
  email?: string;
  employeeId: string;
  department: string;
  assignedSubjects: string[] | any[];
  assignedClasses: string[] | any[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SubjectDTO {
  _id: string;
  name: string;
  code: string;
  credits: number;
  program?: string;
  department: string;
  semester: number;
  createdAt?: string | Date;
}

export interface ClassDTO {
  _id: string;
  name: string;
  program?: string;
  department: string;
  academicYear: string;
  year?: number;
  semester: number;
  section: string;
  teacherIds: string[] | any[];
  subjectIds: string[] | any[];
  createdAt?: string | Date;
}

export interface AcademicRecordDTO {
  _id: string;
  studentId: string;
  subjectId: string;
  subject?: SubjectDTO;
  academicYear: string;
  semester: number;
  internalMarks: number;
  previousScore: number;
  assignmentCompletion: number;
  studyHours: number;
  participation: number;
  attendance: number;
  finalScore?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AttendanceRecordDTO {
  _id: string;
  studentId: string;
  student?: StudentDTO;
  subjectId: string;
  subject?: SubjectDTO;
  classId?: string;
  date: string | Date;
  status: AttendanceStatus;
  markedBy?: string;
  percentage?: number;
  createdAt?: string | Date;
}

export type StandardAssessmentType =
  | 'Mid 1'
  | 'Mid 2'
  | 'Internal Lab 1'
  | 'Internal Lab 2'
  | 'External Lab'
  | 'Assignment';

export const STANDARD_ASSESSMENT_TYPES: StandardAssessmentType[] = [
  'Mid 1',
  'Mid 2',
  'Internal Lab 1',
  'Internal Lab 2',
  'External Lab',
  'Assignment',
];

export type AssessmentType =
  | StandardAssessmentType
  | 'Internal Assessment 1'
  | 'Internal Assessment 2'
  | 'Mid Examination'
  | 'Other';

export interface ProgramDTO {
  _id?: string;
  name: string;
  code: string;
  durationYears: number;
  totalSemesters: number;
  departments: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface DepartmentDTO {
  _id?: string;
  name: string;
  code: string;
  program: string;
  createdAt?: string | Date;
}

export interface SubjectMarksRecord {
  assessmentType: StandardAssessmentType | string;
  obtainedMarks: number;
  maximumMarks: number;
  date?: string | Date;
}

export interface SubjectAcademicHistory {
  subjectId: string;
  name: string;
  code: string;
  credits?: number;
  marks: Record<string, { obtainedMarks: number; maximumMarks: number }>;
  totalObtained: number;
  totalMaximum: number;
  assessmentPerformance: number; // percentage
}

export interface SemesterAcademicHistory {
  semester: number;
  year: number;
  subjects: SubjectAcademicHistory[];
  totalObtained: number;
  totalMaximum: number;
  assessmentPerformance: number;
}

export interface YearAcademicHistory {
  year: number;
  yearLabel: string;
  semesters: SemesterAcademicHistory[];
}

export interface StudentFullAcademicHistoryDTO {
  program: string;
  durationYears: number;
  totalSemesters: number;
  currentYear: number;
  currentSemester: number;
  years: YearAcademicHistory[];
}

export interface AssessmentDTO {
  _id: string;
  studentId: string;
  student?: StudentDTO;
  subjectId: string;
  subject?: SubjectDTO;
  classId?: string;
  academicYear: string;
  semester: number;
  assessmentType: AssessmentType | string;
  title?: string;
  obtainedMarks: number;
  maximumMarks: number;
  date: string | Date;
  markedBy?: string;
  notes?: string;
  createdAt?: string | Date;
}

export interface AssignmentDTO {
  _id: string;
  studentId?: string;
  subjectId: string;
  subject?: SubjectDTO;
  classId?: string;
  title: string;
  description?: string;
  dueDate: string | Date;
  maximumMarks: number;
  teacherId?: string;
  submittedAt?: string | Date;
  status?: AssignmentStatus;
  score?: number;
  createdAt?: string | Date;
}

export interface AssignmentSubmissionDTO {
  _id: string;
  assignmentId: string;
  assignment?: AssignmentDTO;
  studentId: string;
  student?: StudentDTO;
  status: 'SUBMITTED' | 'NOT_SUBMITTED' | 'LATE';
  submittedAt?: string | Date;
  obtainedMarks?: number;
  notes?: string;
  createdAt?: string | Date;
}

export interface StudyLogDTO {
  _id: string;
  studentId: string;
  student?: StudentDTO;
  subjectId?: string;
  subject?: SubjectDTO;
  date: string | Date;
  hours: number;
  topicsCovered?: string;
  notes?: string;
  createdAt?: string | Date;
}

export interface ParticipationRecordDTO {
  _id: string;
  studentId: string;
  student?: StudentDTO;
  subjectId: string;
  subject?: SubjectDTO;
  classId?: string;
  date: string | Date;
  obtainedScore: number;
  maximumScore: number;
  teacherId?: string;
  notes?: string;
  createdAt?: string | Date;
}

export interface MetricBreakdown<T = any> {
  value: number;
  formattedValue: string;
  subtext: string;
  formula: string;
  source: string;
  records?: T[];
  bySubject?: any[];
  stats?: Record<string, any>;
}

export interface StudentCalculatedMetricsDTO {
  attendance: MetricBreakdown<AttendanceRecordDTO>;
  previousScore: MetricBreakdown<any>;
  internalMarks: MetricBreakdown<AssessmentDTO>;
  assignmentCompletion: MetricBreakdown<AssignmentSubmissionDTO | any>;
  studyHours: MetricBreakdown<StudyLogDTO>;
  participation: MetricBreakdown<ParticipationRecordDTO>;
  featureInputs: FeatureInputs;
}

export interface InterventionDTO {
  _id: string;
  studentId: string;
  student?: StudentDTO;
  teacherId: string;
  teacher?: TeacherDTO | UserDTO;
  predictionId?: string;
  type: InterventionType;
  title: string;
  description: string;
  priority: InterventionPriority;
  status: InterventionStatus;
  dueDate: string | Date;
  completedAt?: string | Date;
  outcome?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface NotificationDTO {
  _id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedStudentId?: string;
  relatedPredictionId?: string;
  createdAt: string | Date;
}

export interface AuditLogDTO {
  _id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  timestamp: string | Date;
}

export interface ModelMetadataDTO {
  _id: string;
  version: string;
  createdAt: string | Date;
  features: string[];
  datasetIdentifier: string;
  mae: number;
  rmse: number;
  r2: number;
  frameworkVersion: string;
  status: 'ACTIVE' | 'ARCHIVED';
  hyperparameters: Record<string, any>;
}

export interface DashboardSummaryDTO {
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averagePredictedScore: number;
  averageAttendance: number;
  interventionCompletionRate: number;
  riskDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  performanceTrend: {
    period: string;
    averageScore: number;
    studentCount: number;
  }[];
  attendanceVsPerformance: {
    studentName: string;
    studentId?: string;
    attendance: number;
    predictedScore: number;
    riskLevel: RiskLevel;
  }[];
  studentsRequiringAttention: {
    _id: string;
    studentId: string;
    name: string;
    department: string;
    className: string;
    predictedScore: number;
    riskLevel: RiskLevel;
    topRiskFactor: string;
    lastInterventionStatus?: string;
    attendance: number;
    previousScore: number;
  }[];
}
