import { Request, Response } from 'express';
import { ParticipationRecord } from '../models/ParticipationRecord';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { logAuditEvent } from '../middleware/audit';

export async function getParticipation(req: Request, res: Response): Promise<void> {
  const { studentId, subjectId, classId, date } = req.query;

  try {
    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (classId) query.classId = classId;

    if (date) {
      const d = new Date(date as string);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      query.date = { $gte: startOfDay, $lt: endOfDay };
    }

    const records = await ParticipationRecord.find(query)
      .populate('studentId', 'name studentId department section semester')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve participation records.',
      errors: [error.message],
    });
  }
}

export async function getParticipationSheet(req: Request, res: Response): Promise<void> {
  const { classId, subjectId, date } = req.query;

  if (!classId || !date) {
    res.status(400).json({ success: false, message: 'Class ID and Date are required.' });
    return;
  }

  try {
    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      res.status(404).json({ success: false, message: 'Class not found.' });
      return;
    }

    const students = await Student.find({
      department: targetClass.department,
      semester: targetClass.semester,
      section: targetClass.section,
      status: 'ACTIVE',
    })
      .sort({ studentId: 1 })
      .lean();

    const d = new Date(date as string);
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

    const query: any = {
      classId: targetClass._id,
      date: { $gte: startOfDay, $lt: endOfDay },
    };
    if (subjectId) query.subjectId = subjectId;

    const existingRecords = await ParticipationRecord.find(query).lean();
    const partMap = new Map();
    existingRecords.forEach((r) => partMap.set(r.studentId.toString(), r));

    const sheet = students.map((s) => {
      const existing = partMap.get(s._id.toString());
      return {
        studentId: s._id,
        studentNumber: s.studentId,
        studentName: s.name,
        department: s.department,
        section: s.section,
        semester: s.semester,
        recordId: existing ? existing._id : null,
        obtainedScore: existing ? existing.obtainedScore : 4,
        maximumScore: existing ? existing.maximumScore : 5,
        notes: existing ? existing.notes : '',
      };
    });

    res.json({
      success: true,
      data: {
        class: targetClass,
        date: startOfDay,
        students: sheet,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve participation sheet.',
      errors: [error.message],
    });
  }
}

export async function recordParticipationBatch(req: Request, res: Response): Promise<void> {
  const { classId, subjectId, date, records } = req.body;

  if (!subjectId || !date || !Array.isArray(records)) {
    res.status(400).json({
      success: false,
      message: 'Subject ID, Date, and Records array are required.',
    });
    return;
  }

  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const bulkOps = records.map(
      (r: { studentId: string; obtainedScore: number; maximumScore?: number; notes?: string }) => ({
        updateOne: {
          filter: {
            studentId: r.studentId,
            subjectId,
            date: startOfDay,
          },
          update: {
            $set: {
              studentId: r.studentId,
              subjectId,
              classId: classId || undefined,
              date: startOfDay,
              obtainedScore: Number(r.obtainedScore),
              maximumScore: r.maximumScore ? Number(r.maximumScore) : 5,
              teacherId: req.user?.id,
              notes: r.notes?.trim(),
            },
          },
          upsert: true,
        },
      })
    );

    if (bulkOps.length > 0) {
      await ParticipationRecord.bulkWrite(bulkOps as any);
    }

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'RECORD_PARTICIPATION_BATCH',
      'PARTICIPATION',
      classId?.toString(),
      { count: records.length, date: startOfDay, subjectId },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `Successfully saved participation scores for ${records.length} students.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to record participation.',
      errors: [error.message],
    });
  }
}
