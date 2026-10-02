import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { studentMetricService } from '../services/studentMetricService';
import { logAuditEvent } from '../middleware/audit';
import { resolveCanonicalCohort, buildStudentQuery } from '../utils/canonicalCohort';

/**
 * Normalizes any date string (YYYY-MM-DD or ISO) to UTC midnight range
 * Eliminates timezone conversion skew across environments
 */
export function parseDateRange(dateStr: string) {
  const clean = (dateStr || '').split('T')[0];
  const parts = clean.split('-').map(Number);
  const y = parts[0] || 2026;
  const m = parts[1] || 9;
  const d = parts[2] || 1;
  const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  return { startOfDay, endOfDay, normalizedDate: startOfDay };
}

export async function getAttendance(req: Request, res: Response): Promise<void> {
  const { classId, subjectId, date, studentId } = req.query;

  try {
    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (classId) query.classId = classId;

    if (date) {
      const { startOfDay, endOfDay } = parseDateRange(date as string);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const records = await AttendanceRecord.find(query)
      .populate('studentId', 'name studentId department section semester')
      .populate('subjectId', 'name code')
      .populate('markedBy', 'name email role')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance records.',
      errors: [error.message],
    });
  }
}

export async function getClassAttendanceSheet(req: Request, res: Response): Promise<void> {
  const { classId, program, programId, department, departmentId, year, semester, section, subjectId, date } = req.query;

  if (!date) {
    res.status(400).json({ success: false, message: 'Date is required.' });
    return;
  }

  try {
    let studentQuery: any = { status: 'ACTIVE' };

    if (classId && mongoose.Types.ObjectId.isValid(classId as string)) {
      const targetClass = await Class.findById(classId);
      if (targetClass) {
        studentQuery.department = targetClass.department;
        studentQuery.semester = targetClass.semester;
        studentQuery.section = targetClass.section;
        if (targetClass.year) studentQuery.year = targetClass.year;
        if (targetClass.program) studentQuery.program = targetClass.program;
      }
    } else {
      const resolved = await resolveCanonicalCohort({
        program: program as string,
        programId: programId as string,
        department: department as string,
        departmentId: departmentId as string,
        year: year as string,
        semester: semester as string,
        section: section as string,
      });

      studentQuery = buildStudentQuery(resolved, { status: 'ACTIVE' });
    }

    const students = await Student.find(studentQuery)
      .sort({ studentId: 1 })
      .lean();

    const studentIds = students.map((s) => s._id);

    // 1. Calculate overall/subject-wise current attendance for each student
    const historyMatch: any = { studentId: { $in: studentIds } };
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId as string)) {
      historyMatch.subjectId = new mongoose.Types.ObjectId(subjectId as string);
    }

    const attendanceStats = await AttendanceRecord.aggregate([
      { $match: historyMatch },
      {
        $group: {
          _id: '$studentId',
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
          },
          absentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = new Map();
    attendanceStats.forEach((st) => {
      statsMap.set(st._id.toString(), st);
    });

    // 2. Fetch today's records for the selected date
    const { startOfDay, endOfDay } = parseDateRange(date as string);
    const todayQuery: any = {
      studentId: { $in: studentIds },
      date: { $gte: startOfDay, $lte: endOfDay },
    };
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId as string)) {
      todayQuery.subjectId = new mongoose.Types.ObjectId(subjectId as string);
    }

    const todayRecords = await AttendanceRecord.find(todayQuery).lean();
    const todayMap = new Map();
    todayRecords.forEach((r) => {
      todayMap.set(r.studentId.toString(), r);
    });

    // 3. Assemble sheet items
    const sheet = students.map((s) => {
      const sIdStr = s._id.toString();
      const existing = todayMap.get(sIdStr);
      const hist = statsMap.get(sIdStr) || { totalClasses: 0, presentClasses: 0, absentClasses: 0 };

      const percentage =
        hist.totalClasses > 0
          ? Math.round((hist.presentClasses / hist.totalClasses) * 1000) / 10
          : 0;

      return {
        studentId: s._id,
        studentNumber: s.studentId,
        studentName: s.name,
        department: s.department,
        section: s.section,
        semester: s.semester,
        recordId: existing ? existing._id : null,
        // Requirement 8: If no record exists for this date, status MUST be 'NOT_MARKED'!
        status: existing ? existing.status : 'NOT_MARKED',
        markedBy: existing ? existing.markedBy : null,
        currentAttendance: {
          totalClasses: hist.totalClasses,
          presentClasses: hist.presentClasses,
          absentClasses: hist.absentClasses,
          percentage,
          formatted: `${percentage}% (${hist.presentClasses} of ${hist.totalClasses} classes attended)`,
        },
      };
    });

    res.json({
      success: true,
      data: {
        date: startOfDay,
        students: sheet,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance sheet.',
      errors: [error.message],
    });
  }
}

export async function recordAttendanceBatch(req: Request, res: Response): Promise<void> {
  const { classId, subjectId, date, records } = req.body;

  if (!subjectId || !date || !Array.isArray(records)) {
    res.status(400).json({
      success: false,
      message: 'Subject, Date, and Records array are required.',
    });
    return;
  }

  try {
    const { normalizedDate } = parseDateRange(date as string);

    // Only process marked records (PRESENT or ABSENT)
    const validRecords = records.filter(
      (r: any) => r && (r.status === 'PRESENT' || r.status === 'ABSENT')
    );

    const bulkOps = validRecords.map((r: { studentId: string; status: 'PRESENT' | 'ABSENT' }) => ({
      updateOne: {
        filter: {
          studentId: r.studentId,
          subjectId,
          date: normalizedDate,
        },
        update: {
          $set: {
            studentId: r.studentId,
            subjectId,
            classId: classId || undefined,
            date: normalizedDate,
            status: r.status,
            markedBy: req.user?.id,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await AttendanceRecord.bulkWrite(bulkOps as any);
    }

    // Trigger recalculation for affected students
    const studentIds = validRecords.map((r: any) => r.studentId);
    Promise.all(
      studentIds.map((sid: string) => studentMetricService.calculateStudentMetrics(sid).catch(() => null))
    ).catch(() => null);

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'RECORD_ATTENDANCE_BATCH',
      'ATTENDANCE',
      classId?.toString(),
      { count: validRecords.length, date: normalizedDate, subjectId },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: `Successfully saved attendance records for ${validRecords.length} students on ${date}.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to save attendance records.',
      errors: [error.message],
    });
  }
}

export async function updateAttendanceRecord(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, date } = req.body;

  try {
    const record = await AttendanceRecord.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Attendance record not found.' });
      return;
    }

    if (status) record.status = status;
    if (date) {
      const { normalizedDate } = parseDateRange(date as string);
      record.date = normalizedDate;
    }
    record.markedBy = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : record.markedBy;

    await record.save();

    // Recalculate metrics
    if (record.studentId) {
      studentMetricService.calculateStudentMetrics(record.studentId).catch(() => null);
    }

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'UPDATE_ATTENDANCE_RECORD',
      'ATTENDANCE',
      record._id.toString(),
      { newStatus: record.status },
      req.ip
    );

    res.json({
      success: true,
      message: 'Attendance record updated successfully.',
      data: record,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record.',
      errors: [error.message],
    });
  }
}
