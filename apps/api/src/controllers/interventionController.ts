import { Request, Response } from 'express';
import { Intervention } from '../models/Intervention';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Notification } from '../models/Notification';
import { logAuditEvent } from '../middleware/audit';

export async function createIntervention(req: Request, res: Response): Promise<void> {
  const {
    studentId,
    teacherId,
    predictionId,
    type,
    title,
    description,
    priority = 'MEDIUM',
    dueDate,
  } = req.body;

  if (!studentId || !type || !title || !description || !dueDate) {
    res.status(400).json({
      success: false,
      message: 'studentId, type, title, description, and dueDate are required.',
    });
    return;
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    // Resolve assigned teacher
    let resolvedTeacherId = teacherId;
    if (!resolvedTeacherId && req.user?.teacherId) {
      resolvedTeacherId = req.user.teacherId;
    }

    if (!resolvedTeacherId) {
      const anyTeacher = await Teacher.findOne();
      resolvedTeacherId = anyTeacher?._id;
    }

    const intervention = await Intervention.create({
      studentId,
      teacherId: resolvedTeacherId,
      predictionId,
      type,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'OPEN',
      dueDate: new Date(dueDate),
    });

    // Notify student if user account exists
    if (student.userId) {
      await Notification.create({
        recipientId: student.userId,
        type: 'INTERVENTION_DUE',
        title: `Academic Support Scheduled: ${title}`,
        message: `An academic support initiative (${type.replace('_', ' ')}) has been scheduled for you due on ${new Date(dueDate).toLocaleDateString()}.`,
        relatedStudentId: student._id,
      });
    }

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_INTERVENTION',
      'INTERVENTION',
      intervention._id.toString(),
      { studentId, type, priority },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Intervention created successfully.',
      data: intervention,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create intervention.',
      errors: [error.message],
    });
  }
}

export async function getInterventions(req: Request, res: Response): Promise<void> {
  const { studentId, teacherId, status, priority, page = '1', limit = '20' } = req.query;

  try {
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (status && status !== 'ALL') query.status = status;
    if (priority && priority !== 'ALL') query.priority = priority;
    if (studentId) query.studentId = studentId;

    if (req.user?.role === 'STUDENT' && req.user.studentId) {
      query.studentId = req.user.studentId;
    } else if (req.user?.role === 'TEACHER' && req.user.teacherId) {
      query.teacherId = req.user.teacherId;
    } else if (teacherId) {
      query.teacherId = teacherId;
    }

    const total = await Intervention.countDocuments(query);
    const interventions = await Intervention.find(query)
      .populate('studentId', 'studentId name department section semester')
      .populate({
        path: 'teacherId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: interventions,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve interventions.',
      errors: [error.message],
    });
  }
}

export async function updateIntervention(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, outcome, notes, priority, dueDate } = req.body;

  try {
    const intervention = await Intervention.findById(id);
    if (!intervention) {
      res.status(404).json({ success: false, message: 'Intervention not found.' });
      return;
    }

    if (status) intervention.status = status;
    if (outcome !== undefined) intervention.outcome = outcome;
    if (notes !== undefined) intervention.notes = notes;
    if (priority) intervention.priority = priority;
    if (dueDate) intervention.dueDate = new Date(dueDate);

    if (status === 'COMPLETED' && !intervention.completedAt) {
      intervention.completedAt = new Date();
    }

    await intervention.save();

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'UPDATE_INTERVENTION',
      'INTERVENTION',
      intervention._id.toString(),
      { status: intervention.status },
      req.ip
    );

    res.json({
      success: true,
      message: 'Intervention updated successfully.',
      data: intervention,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update intervention.',
      errors: [error.message],
    });
  }
}
