import { Request, Response } from 'express';
import { StudyLog } from '../models/StudyLog';
import { Student } from '../models/Student';
import { logAuditEvent } from '../middleware/audit';

export async function getStudyLogs(req: Request, res: Response): Promise<void> {
  const { studentId, startDate, endDate } = req.query;

  try {
    let targetStudentId = studentId as string;

    // Students can only view their own study logs
    if (req.user?.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not linked.' });
        return;
      }
      targetStudentId = student._id.toString();
    }

    const query: any = {};
    if (targetStudentId) query.studentId = targetStudentId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const logs = await StudyLog.find(query)
      .populate('studentId', 'name studentId department section semester')
      .populate('subjectId', 'name code')
      .sort({ date: -1 });

    const totalHours = logs.reduce((sum, l) => sum + (l.hours || 0), 0);

    res.json({
      success: true,
      data: logs,
      stats: {
        totalHours: Math.round(totalHours * 10) / 10,
        count: logs.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve study logs.',
      errors: [error.message],
    });
  }
}

export async function createStudyLog(req: Request, res: Response): Promise<void> {
  const { studentId, subjectId, date, hours, topicsCovered, notes } = req.body;

  try {
    let targetStudentId = studentId;

    if (req.user?.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not linked to user.' });
        return;
      }
      targetStudentId = student._id.toString();
    }

    if (!targetStudentId || hours === undefined) {
      res.status(400).json({
        success: false,
        message: 'Student ID and Hours Studied are required.',
      });
      return;
    }

    const studyHours = Number(hours);
    if (isNaN(studyHours) || studyHours <= 0 || studyHours > 24) {
      res.status(400).json({
        success: false,
        message: 'Hours studied must be between 0.1 and 24 hours.',
      });
      return;
    }

    const log = await StudyLog.create({
      studentId: targetStudentId,
      subjectId: subjectId || undefined,
      date: date ? new Date(date) : new Date(),
      hours: studyHours,
      topicsCovered: topicsCovered?.trim(),
      notes: notes?.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Study log entry recorded successfully.',
      data: log,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to record study log.',
      errors: [error.message],
    });
  }
}

export async function deleteStudyLog(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const log = await StudyLog.findById(id);
    if (!log) {
      res.status(404).json({ success: false, message: 'Study log entry not found.' });
      return;
    }

    // Students can only delete their own
    if (req.user?.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student || log.studentId.toString() !== student._id.toString()) {
        res.status(403).json({ success: false, message: 'Unauthorized to delete this log.' });
        return;
      }
    }

    await StudyLog.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Study log entry deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete study log.',
      errors: [error.message],
    });
  }
}
