import { Request, Response } from 'express';
import { Assessment } from '../models/Assessment';
import { Student } from '../models/Student';
import { logAuditEvent } from '../middleware/audit';

export async function getAssessments(req: Request, res: Response): Promise<void> {
  const { studentId, subjectId, semester } = req.query;

  try {
    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (semester) query.semester = parseInt(semester as string, 10);

    const assessments = await Assessment.find(query)
      .populate('studentId', 'name studentId department section semester')
      .populate('subjectId', 'name code')
      .populate('markedBy', 'name email role')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      data: assessments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment records.',
      errors: [error.message],
    });
  }
}

export async function createAssessment(req: Request, res: Response): Promise<void> {
  const {
    studentId,
    subjectId,
    academicYear,
    semester,
    assessmentType,
    title,
    obtainedMarks,
    maximumMarks,
    date,
    notes,
  } = req.body;

  if (!studentId || !subjectId || !assessmentType || obtainedMarks === undefined || !maximumMarks) {
    res.status(400).json({
      success: false,
      message: 'Student, Subject, Assessment Type, Obtained Marks, and Maximum Marks are required.',
    });
    return;
  }

  const obtained = Number(obtainedMarks);
  const max = Number(maximumMarks);

  if (isNaN(obtained) || obtained < 0) {
    res.status(400).json({ success: false, message: 'Obtained marks must be a non-negative number.' });
    return;
  }
  if (isNaN(max) || max <= 0) {
    res.status(400).json({ success: false, message: 'Maximum marks must be greater than zero.' });
    return;
  }
  if (obtained > max) {
    res.status(400).json({ success: false, message: 'Obtained marks cannot exceed maximum marks.' });
    return;
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    const assessment = await Assessment.create({
      studentId,
      subjectId,
      academicYear: academicYear || student.academicYear || '2025-2026',
      semester: semester ? Number(semester) : student.semester,
      assessmentType,
      title: title?.trim(),
      obtainedMarks: obtained,
      maximumMarks: max,
      date: date ? new Date(date) : new Date(),
      markedBy: req.user?.id,
      notes: notes?.trim(),
    });

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_ASSESSMENT',
      'ASSESSMENT',
      assessment._id.toString(),
      { studentId, subjectId, assessmentType, score: `${obtained}/${max}` },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Assessment score recorded successfully.',
      data: assessment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create assessment.',
      errors: [error.message],
    });
  }
}

export async function updateAssessment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { assessmentType, title, obtainedMarks, maximumMarks, date, notes } = req.body;

  try {
    const assessment = await Assessment.findById(id);
    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment record not found.' });
      return;
    }

    if (assessmentType) assessment.assessmentType = assessmentType;
    if (title !== undefined) assessment.title = title;
    if (obtainedMarks !== undefined) assessment.obtainedMarks = Number(obtainedMarks);
    if (maximumMarks !== undefined) assessment.maximumMarks = Number(maximumMarks);
    if (date) assessment.date = new Date(date);
    if (notes !== undefined) assessment.notes = notes;

    if (assessment.obtainedMarks > assessment.maximumMarks) {
      res.status(400).json({ success: false, message: 'Obtained marks cannot exceed maximum marks.' });
      return;
    }

    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment record updated successfully.',
      data: assessment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update assessment.',
      errors: [error.message],
    });
  }
}

export async function deleteAssessment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const assessment = await Assessment.findByIdAndDelete(id);
    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment record not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Assessment record deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete assessment.',
      errors: [error.message],
    });
  }
}

export async function saveBatchAssessments(req: Request, res: Response): Promise<void> {
  const {
    subjectId,
    academicYear = '2025-2026',
    semester,
    assessmentType,
    maximumMarks,
    records,
  } = req.body;

  if (!subjectId || !assessmentType || !maximumMarks || !Array.isArray(records)) {
    res.status(400).json({
      success: false,
      message: 'Subject, Assessment Type, Maximum Marks, and Records array are required.',
    });
    return;
  }

  const max = Number(maximumMarks);
  if (isNaN(max) || max <= 0) {
    res.status(400).json({ success: false, message: 'Maximum marks must be greater than zero.' });
    return;
  }

  try {
    const semNum = Number(semester);
    const updatedDocs = [];

    for (const item of records) {
      if (!item.studentId) continue;
      const obtained = Number(item.obtainedMarks);
      if (isNaN(obtained) || obtained < 0 || obtained > max) continue;

      const doc = await Assessment.findOneAndUpdate(
        {
          studentId: item.studentId,
          subjectId,
          semester: semNum,
          assessmentType,
        },
        {
          $set: {
            academicYear,
            obtainedMarks: obtained,
            maximumMarks: max,
            date: new Date(),
            markedBy: req.user?.id,
            notes: item.notes ? item.notes.trim() : undefined,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      updatedDocs.push(doc);
    }

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'BATCH_SAVE_ASSESSMENTS',
      'ASSESSMENT',
      subjectId,
      { assessmentType, count: updatedDocs.length, maximumMarks: max },
      req.ip
    );

    res.json({
      success: true,
      message: `Successfully saved ${assessmentType} marks for ${updatedDocs.length} students.`,
      data: updatedDocs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to batch save assessment records.',
      errors: [error.message],
    });
  }
}
