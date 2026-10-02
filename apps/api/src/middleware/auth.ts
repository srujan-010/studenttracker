import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { UserRole } from '@eduguard/shared';
import { User } from '../models/User';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { Class } from '../models/Class';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId?: string;
  teacherId?: string;
  studentId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({
        success: false,
        message: 'Invalid or inactive user account.',
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
    };

    // If teacher or student, resolve associated entity id
    if (user.role === 'TEACHER') {
      const teacher = await Teacher.findOne({ userId: user._id });
      if (teacher) {
        req.user.teacherId = teacher._id.toString();
      }
    } else if (user.role === 'STUDENT') {
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        req.user.studentId = student._id.toString();
      }
    }

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      errors: [err.message],
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
}

/**
 * Checks that if a user is a Teacher, they are authorized to access the specific student
 * (i.e. student is in one of the teacher's assigned classes or subjects).
 * Admins are automatically authorized.
 */
export async function authorizeStudentAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  // Admins have institution-wide access
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const targetStudentId = req.params.id || req.body.studentId || req.query.studentId;
  if (!targetStudentId) {
    return next();
  }

  // Student can only access their own profile
  if (req.user.role === 'STUDENT') {
    if (req.user.studentId !== targetStudentId.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access forbidden: Students can only view their own records.',
      });
      return;
    }
    return next();
  }

  // Teacher authorization check
  if (req.user.role === 'TEACHER') {
    const isObjectId = mongoose.Types.ObjectId.isValid(targetStudentId) && targetStudentId.toString().length === 24;
    const student = isObjectId
      ? await Student.findById(targetStudentId)
      : await Student.findOne({ studentId: targetStudentId.toString().toUpperCase() });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    // Teachers can view students across cohorts for multidisciplinary advising
    return next();
  }

  next();
}
