import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/environment';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import teacherRoutes from './routes/teacherRoutes';
import classRoutes from './routes/classRoutes';
import subjectRoutes from './routes/subjectRoutes';
import academicRecordRoutes from './routes/academicRecordRoutes';
import predictionRoutes from './routes/predictionRoutes';
import interventionRoutes from './routes/interventionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import settingsRoutes from './routes/settingsRoutes';
import reportRoutes from './routes/reportRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import studyLogRoutes from './routes/studyLogRoutes';
import participationRoutes from './routes/participationRoutes';
import programRoutes from './routes/programRoutes';
import departmentRoutes from './routes/departmentRoutes';
import { mlClientService } from './services/mlClientService';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';

export const app = express();

// Ensure database connection for serverless/function invocations
app.use(async (_req, _res, next) => {
  if (mongoose.connection.readyState === 0) {
    try {
      await connectDatabase();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Security & Parsing
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost dev origins or direct curl
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const mlHealth = await mlClientService.checkHealth();
  res.json({
    status: 'HEALTHY',
    service: 'EduGuard AI Backend API',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    mlService: mlHealth,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/academic-records', academicRecordRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/study-logs', studyLogRoutes);
app.use('/api/participation', participationRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/departments', departmentRoutes);

// 404 Route Not Found
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Resource endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Error handling
app.use(errorHandler);

export default app;
