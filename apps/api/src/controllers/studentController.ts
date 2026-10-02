import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { AcademicRecord } from '../models/AcademicRecord';
import { Prediction } from '../models/Prediction';
import { Intervention } from '../models/Intervention';
import { Teacher } from '../models/Teacher';
import { Class } from '../models/Class';
import { logAuditEvent } from '../middleware/audit';
import { parseAndValidateStudentCSV } from '../services/csvImportService';
import { studentMetricService } from '../services/studentMetricService';
import { resolveCanonicalCohort, buildStudentQuery } from '../utils/canonicalCohort';

export async function getStudents(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      program,
      programId,
      department,
      departmentId,
      year,
      semester,
      section,
      riskLevel,
      status = 'ACTIVE',
      page = '1',
      limit = '25',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    let baseQuery: any = {};
    if (status !== 'ALL') {
      baseQuery.status = status;
    }

    // Role-based restrictions
    if (req.user?.role === 'STUDENT') {
      baseQuery.userId = req.user.id;
    }

    // Resolve canonical cohort
    const yearParam = year || (req.query.academicYear as string);
    const resolved = await resolveCanonicalCohort({
      program: program as string,
      programId: programId as string,
      department: department as string,
      departmentId: departmentId as string,
      year: yearParam as string,
      semester: semester as string,
      section: section as string,
    });

    const query = buildStudentQuery(resolved, baseQuery);

    // Global Search across name, studentId, email
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      const searchCondition = {
        $or: [{ name: searchRegex }, { studentId: searchRegex }, { email: searchRegex }],
      };
      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchCondition];
        delete query.$or;
      } else {
        query.$or = searchCondition.$or;
      }
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ studentId: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Populate latest prediction for each student
    const studentIds = students.map((s) => s._id);
    const latestPredictions = await Prediction.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$studentId',
          latest: { $first: '$$ROOT' },
        },
      },
    ]);

    const predictionMap = new Map();
    latestPredictions.forEach((p) => {
      predictionMap.set(p._id.toString(), p.latest);
    });

    let enrichedStudents = students.map((s) => ({
      ...s,
      latestPrediction: predictionMap.get(s._id.toString()) || null,
    }));

    // If risk level filter is specified
    if (riskLevel && riskLevel !== 'ALL') {
      enrichedStudents = enrichedStudents.filter(
        (s) => s.latestPrediction?.riskLevel === riskLevel
      );
    }

    res.json({
      success: true,
      data: enrichedStudents,
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
      message: 'Failed to retrieve students.',
      errors: [error.message],
    });
  }
}

export async function getStudentById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    let student = null;
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.toString().length === 24;
    if (isObjectId) {
      student = await Student.findById(id).lean();
    } else {
      student = await Student.findOne({ studentId: id.toUpperCase() }).lean();
    }

    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    // Role security check
    if (req.user?.role === 'STUDENT' && student.userId?.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Access denied to this student profile.' });
      return;
    }

    // Fetch related records & calculate real metrics from MongoDB records
    const [academicRecords, predictions, interventions, calculatedMetrics, academicHistory] = await Promise.all([
      AcademicRecord.find({ studentId: student._id }).populate('subjectId').sort({ semester: 1 }).lean(),
      Prediction.find({ studentId: student._id }).sort({ createdAt: -1 }).lean(),
      Intervention.find({ studentId: student._id }).populate('teacherId').sort({ createdAt: -1 }).lean(),
      studentMetricService.calculateStudentMetrics(student._id).catch(() => null),
      studentMetricService.getFullAcademicHistory(student._id).catch(() => null),
    ]);

    res.json({
      success: true,
      data: {
        ...student,
        academicRecords,
        predictions,
        latestPrediction: predictions[0] || null,
        interventions,
        calculatedMetrics,
        academicHistory,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student profile.',
      errors: [error.message],
    });
  }
}

export async function getMyProfile(req: Request, res: Response): Promise<void> {
  try {
    const student = await Student.findOne({ userId: req.user?.id }).lean();
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not linked to this account.' });
      return;
    }

    const [academicRecords, predictions, interventions, calculatedMetrics, academicHistory] = await Promise.all([
      AcademicRecord.find({ studentId: student._id }).populate('subjectId').sort({ semester: 1 }).lean(),
      Prediction.find({ studentId: student._id }).sort({ createdAt: -1 }).lean(),
      Intervention.find({ studentId: student._id }).populate('teacherId').sort({ createdAt: -1 }).lean(),
      studentMetricService.calculateStudentMetrics(student._id).catch(() => null),
      studentMetricService.getFullAcademicHistory(student._id).catch(() => null),
    ]);

    res.json({
      success: true,
      data: {
        ...student,
        academicRecords,
        predictions,
        latestPrediction: predictions[0] || null,
        interventions,
        calculatedMetrics,
        academicHistory,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve personal profile.',
      errors: [error.message],
    });
  }
}

export async function getStudentMetrics(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    let student = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await Student.findById(id).lean();
    } else {
      student = await Student.findOne({ studentId: id.toUpperCase() }).lean();
    }

    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    if (req.user?.role === 'STUDENT' && student.userId?.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Access denied to this student metrics.' });
      return;
    }

    const calculatedMetrics = await studentMetricService.calculateStudentMetrics(student._id);
    res.json({
      success: true,
      data: calculatedMetrics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate student metrics.',
      errors: [error.message],
    });
  }
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const {
    studentId,
    name,
    email,
    phone,
    department,
    course,
    year,
    section,
    academicYear,
    semester,
  } = req.body;

  if (!studentId || !name || !email || !department || !year || !section || !semester) {
    res.status(400).json({
      success: false,
      message: 'Missing required student details.',
    });
    return;
  }

  try {
    const existing = await Student.findOne({
      $or: [{ studentId: studentId.toUpperCase().trim() }, { email: email.toLowerCase().trim() }],
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A student with this Student ID or Email already exists.',
      });
      return;
    }

    const student = await Student.create({
      studentId: studentId.toUpperCase().trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      department: department.trim(),
      course: course?.trim() || 'B.Tech',
      year: Number(year),
      section: section.toUpperCase().trim(),
      academicYear: academicYear?.trim() || '2025-2026',
      semester: Number(semester),
      status: 'ACTIVE',
    });

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_STUDENT',
      'STUDENT',
      student._id.toString(),
      { studentId: student.studentId, name: student.name },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Student record created successfully.',
      data: student,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create student record.',
      errors: [error.message],
    });
  }
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    const fields = [
      'name',
      'email',
      'phone',
      'department',
      'course',
      'year',
      'section',
      'academicYear',
      'semester',
      'status',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (student as any)[field] = req.body[field];
      }
    });

    await student.save();

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'UPDATE_STUDENT',
      'STUDENT',
      student._id.toString(),
      { studentId: student.studentId },
      req.ip
    );

    res.json({
      success: true,
      message: 'Student record updated successfully.',
      data: student,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update student record.',
      errors: [error.message],
    });
  }
}

export async function importStudentsCSV(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No CSV file provided.' });
    return;
  }

  try {
    const result = await parseAndValidateStudentCSV(req.file.buffer);

    let insertedCount = 0;
    const importErrors = [...result.errors];

    for (const validRow of result.validRows) {
      try {
        const existing = await Student.findOne({
          $or: [{ studentId: validRow.studentId }, { email: validRow.email }],
        });

        if (existing) {
          importErrors.push({
            row: 0,
            studentId: validRow.studentId,
            error: `Student ID ${validRow.studentId} or email ${validRow.email} already exists in database.`,
          });
          continue;
        }

        await Student.create(validRow);
        insertedCount++;
      } catch (err: any) {
        importErrors.push({
          row: 0,
          studentId: validRow.studentId,
          error: err.message,
        });
      }
    }

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'IMPORT_STUDENTS_CSV',
      'STUDENT',
      undefined,
      { insertedCount, failedCount: importErrors.length },
      req.ip
    );

    res.json({
      success: true,
      message: `CSV processing finished: ${insertedCount} imported, ${importErrors.length} rejected/skipped.`,
      data: {
        totalRows: result.totalRows,
        insertedCount,
        rejectedCount: importErrors.length,
        errors: importErrors,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV file.',
      errors: [error.message],
    });
  }
}
