import { Request, Response } from 'express';
import { Subject } from '../models/Subject';
import { logAuditEvent } from '../middleware/audit';
import { resolveCanonicalCohort } from '../utils/canonicalCohort';

export async function getSubjects(req: Request, res: Response): Promise<void> {
  const { department, departmentId, semester, program, programId } = req.query;

  try {
    const query: any = {};

    const resolved = await resolveCanonicalCohort({
      program: program as string,
      programId: programId as string,
      department: department as string,
      departmentId: departmentId as string,
      semester: semester as string,
    });

    if (resolved.program) {
      query.program = { $in: resolved.program.namesToMatch };
    }
    if (resolved.department) {
      query.department = { $in: resolved.department.namesToMatch };
    }
    if (resolved.semester !== undefined) {
      query.semester = resolved.semester;
    }

    const subjects = await Subject.find(query).sort({ department: 1, semester: 1, code: 1 });

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subjects.',
      errors: [error.message],
    });
  }
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  const { name, code, credits, department, semester, program = 'B.Tech' } = req.body;

  if (!name || !code || !credits || !department || !semester) {
    res.status(400).json({
      success: false,
      message: 'Name, code, credits, department, and semester are required.',
    });
    return;
  }

  try {
    const existing = await Subject.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A subject with this subject code already exists.',
      });
      return;
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      credits: Number(credits),
      program: program.trim(),
      department: department.trim(),
      semester: Number(semester),
    });

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_SUBJECT',
      'SUBJECT',
      subject._id.toString(),
      { code: subject.code, name: subject.name },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      data: subject,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create subject.',
      errors: [error.message],
    });
  }
}
