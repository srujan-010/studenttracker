import { Request, Response } from 'express';
import { AcademicRecord } from '../models/AcademicRecord';
import { Student } from '../models/Student';
import { logAuditEvent } from '../middleware/audit';

export async function getAcademicRecords(req: Request, res: Response): Promise<void> {
  const { studentId, semester, subjectId } = req.query;

  try {
    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (semester) query.semester = parseInt(semester as string, 10);
    if (subjectId) query.subjectId = subjectId;

    const records = await AcademicRecord.find(query)
      .populate('subjectId')
      .populate('studentId', 'studentId name department section semester')
      .sort({ semester: 1, createdAt: -1 });

    res.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve academic records.',
      errors: [error.message],
    });
  }
}

export async function upsertAcademicRecord(req: Request, res: Response): Promise<void> {
  const {
    studentId,
    subjectId,
    academicYear,
    semester,
    internalMarks,
    previousScore,
    assignmentCompletion,
    studyHours,
    participation,
    attendance,
    finalScore,
  } = req.body;

  // Validation
  const errors: string[] = [];
  if (!studentId) errors.push('Student ID is required');
  if (!subjectId) errors.push('Subject ID is required');
  if (!semester) errors.push('Semester is required');

  if (attendance !== undefined && (attendance < 0 || attendance > 100)) {
    errors.push('Attendance must be between 0% and 100%');
  }
  if (internalMarks !== undefined && (internalMarks < 0 || internalMarks > 100)) {
    errors.push('Internal marks must be between 0 and 100');
  }
  if (previousScore !== undefined && (previousScore < 0 || previousScore > 100)) {
    errors.push('Previous score must be between 0 and 100');
  }
  if (assignmentCompletion !== undefined && (assignmentCompletion < 0 || assignmentCompletion > 100)) {
    errors.push('Assignment completion must be between 0% and 100%');
  }
  if (participation !== undefined && (participation < 0 || participation > 100)) {
    errors.push('Participation must be between 0% and 100%');
  }
  if (studyHours !== undefined && (studyHours < 0 || studyHours > 100)) {
    errors.push('Study hours must be positive (0 to 100 hrs/week)');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    const record = await AcademicRecord.findOneAndUpdate(
      { studentId, subjectId, semester },
      {
        studentId,
        subjectId,
        academicYear: academicYear || student.academicYear,
        semester,
        internalMarks: Number(internalMarks),
        previousScore: Number(previousScore),
        assignmentCompletion: Number(assignmentCompletion),
        studyHours: Number(studyHours),
        participation: Number(participation),
        attendance: Number(attendance),
        finalScore: finalScore !== undefined ? Number(finalScore) : undefined,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'SAVE_ACADEMIC_RECORD',
      'ACADEMIC_RECORD',
      record._id.toString(),
      { studentId, subjectId, semester },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Academic record saved successfully.',
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to save academic record.',
      errors: [error.message],
    });
  }
}
