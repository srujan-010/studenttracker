import { Request, Response } from 'express';
import { Class } from '../models/Class';
import { logAuditEvent } from '../middleware/audit';

export async function getClasses(req: Request, res: Response): Promise<void> {
  const { program, department, semester, year } = req.query;

  try {
    const query: any = {};
    if (program && program !== 'ALL') query.program = program;
    if (department && department !== 'ALL') query.department = department;
    if (semester && semester !== 'ALL') query.semester = parseInt(semester as string, 10);
    if (year && year !== 'ALL') query.year = parseInt(year as string, 10);

    const classes = await Class.find(query)
      .populate({
        path: 'teacherIds',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('subjectIds', 'name code credits')
      .sort({ program: 1, department: 1, semester: 1, section: 1 });

    res.json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes.',
      errors: [error.message],
    });
  }
}

export async function createClass(req: Request, res: Response): Promise<void> {
  const {
    name,
    program = 'B.Tech',
    department,
    academicYear = '2025-2026',
    year,
    semester,
    section,
    teacherIds,
    subjectIds,
  } = req.body;

  if (!name || !department || !semester || !section) {
    res.status(400).json({
      success: false,
      message: 'Name, department, semester, and section are required.',
    });
    return;
  }

  const semNum = Number(semester);
  const calcYear = year ? Number(year) : Math.ceil(semNum / 2);

  try {
    const existing = await Class.findOne({
      department: department.trim(),
      academicYear,
      semester: semNum,
      section: section.toUpperCase().trim(),
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A class with this department, semester, and section already exists for this academic year.',
      });
      return;
    }

    const newClass = await Class.create({
      name: name.trim(),
      program: program.trim(),
      department: department.trim(),
      academicYear,
      year: calcYear,
      semester: semNum,
      section: section.toUpperCase().trim(),
      teacherIds: teacherIds || [],
      subjectIds: subjectIds || [],
    });

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_CLASS',
      'CLASS',
      newClass._id.toString(),
      { name: newClass.name },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      data: newClass,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create class.',
      errors: [error.message],
    });
  }
}
