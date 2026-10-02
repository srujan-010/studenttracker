import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { logAuditEvent } from '../middleware/audit';

export async function getAssignments(req: Request, res: Response): Promise<void> {
  const { subjectId, classId, studentId } = req.query;

  try {
    const query: any = {};
    if (subjectId) query.subjectId = subjectId;
    if (classId) query.classId = classId;

    const assignments = await Assignment.find(query)
      .populate('subjectId', 'name code')
      .populate('classId', 'name department semester section')
      .populate('teacherId', 'name email')
      .sort({ dueDate: -1 });

    // If studentId is provided or current user is student, attach submission status
    let userStudentId = studentId as string;
    if (!userStudentId && req.user?.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user.id });
      if (student) userStudentId = student._id.toString();
    }

    if (userStudentId) {
      const submissions = await AssignmentSubmission.find({ studentId: userStudentId }).lean();
      const subMap = new Map();
      submissions.forEach((s) => subMap.set(s.assignmentId.toString(), s));

      const enriched = assignments.map((a) => {
        const sub = subMap.get(a._id.toString());
        return {
          ...a.toObject(),
          mySubmission: sub || null,
          submissionStatus: sub ? sub.status : 'NOT_SUBMITTED',
        };
      });

      res.json({ success: true, data: enriched });
      return;
    }

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignments.',
      errors: [error.message],
    });
  }
}

export async function createAssignment(req: Request, res: Response): Promise<void> {
  const { title, subjectId, classId, description, dueDate, maximumMarks } = req.body;

  if (!title || !subjectId || !dueDate) {
    res.status(400).json({
      success: false,
      message: 'Title, Subject, and Due Date are required.',
    });
    return;
  }

  try {
    const assignment = await Assignment.create({
      title: title.trim(),
      subjectId,
      classId: classId || undefined,
      description: description?.trim(),
      dueDate: new Date(dueDate),
      maximumMarks: maximumMarks ? Number(maximumMarks) : 100,
      teacherId: req.user?.id,
    });

    // Auto-create initial NOT_SUBMITTED submissions for students in class if classId is specified
    if (classId) {
      const targetClass = await Class.findById(classId);
      if (targetClass) {
        const students = await Student.find({
          department: targetClass.department,
          semester: targetClass.semester,
          section: targetClass.section,
          status: 'ACTIVE',
        }).select('_id');

        const submissionDocs = students.map((s) => ({
          assignmentId: assignment._id,
          studentId: s._id,
          status: 'NOT_SUBMITTED',
        }));

        if (submissionDocs.length > 0) {
          await AssignmentSubmission.insertMany(submissionDocs, { ordered: false }).catch(() => {});
        }
      }
    }

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_ASSIGNMENT',
      'ASSIGNMENT',
      assignment._id.toString(),
      { title: assignment.title, subjectId, dueDate },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      data: assignment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment.',
      errors: [error.message],
    });
  }
}

export async function getAssignmentSubmissions(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const submissions = await AssignmentSubmission.find({ assignmentId: id })
      .populate('studentId', 'name studentId department section semester')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignment submissions.',
      errors: [error.message],
    });
  }
}

export async function updateSubmissionStatus(req: Request, res: Response): Promise<void> {
  const { assignmentId, studentId, status, obtainedMarks, notes } = req.body;

  if (!assignmentId || !studentId || !status) {
    res.status(400).json({
      success: false,
      message: 'Assignment ID, Student ID, and Status are required.',
    });
    return;
  }

  try {
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId, studentId },
      {
        assignmentId,
        studentId,
        status,
        submittedAt: status === 'SUBMITTED' || status === 'LATE' ? new Date() : undefined,
        obtainedMarks: obtainedMarks !== undefined ? Number(obtainedMarks) : undefined,
        notes: notes?.trim(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Submission status updated.',
      data: submission,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update submission status.',
      errors: [error.message],
    });
  }
}

export async function submitMyAssignment(req: Request, res: Response): Promise<void> {
  const { id } = req.params; // assignmentId
  const { notes } = req.body;

  try {
    const student = await Student.findOne({ userId: req.user?.id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not linked to user.' });
      return;
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found.' });
      return;
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId: id, studentId: student._id },
      {
        assignmentId: id,
        studentId: student._id,
        status,
        submittedAt: new Date(),
        notes: notes?.trim(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: `Assignment submitted successfully (${status}).`,
      data: submission,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment.',
      errors: [error.message],
    });
  }
}
