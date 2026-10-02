import { Request, Response } from 'express';
import { Department } from '../models/Department';
import { logAuditEvent } from '../middleware/audit';
import { resolveCanonicalCohort } from '../utils/canonicalCohort';

export async function getDepartments(req: Request, res: Response): Promise<void> {
  const { program, programId } = req.query;

  try {
    const query: any = {};
    if (program || programId) {
      const raw = (programId || program) as string;
      if (raw !== 'ALL') {
        const resolved = await resolveCanonicalCohort({ program: program as string, programId: programId as string });
        if (resolved.program) {
          query.program = { $in: resolved.program.namesToMatch };
        }
      }
    }

    let departments = await Department.find(query).sort({ program: 1, name: 1 }).lean();

    if (departments.length === 0 && !program) {
      const defaultDepts = [
        { name: 'Computer Science', code: 'CSE', program: 'B.Tech' },
        { name: 'Information Technology', code: 'IT', program: 'B.Tech' },
        { name: 'Electronics & Communication', code: 'ECE', program: 'B.Tech' },
        { name: 'Business Administration', code: 'BBA', program: 'BBA' },
        { name: 'Marketing', code: 'MKT', program: 'BBA' },
        { name: 'Finance', code: 'FIN', program: 'BBA' },
        { name: 'Computer Science', code: 'BSC-CS', program: 'B.Sc' },
        { name: 'Data Science', code: 'BSC-DS', program: 'B.Sc' },
        { name: 'Mathematics', code: 'BSC-MATH', program: 'B.Sc' },
      ];
      await Department.insertMany(defaultDepts);
      departments = await Department.find(query).sort({ program: 1, name: 1 }).lean();
    }

    res.json({
      success: true,
      data: departments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments.',
      errors: [error.message],
    });
  }
}

export async function createDepartment(req: Request, res: Response): Promise<void> {
  const { name, code, program } = req.body;

  if (!name || !code || !program) {
    res.status(400).json({
      success: false,
      message: 'Department name, code, and associated program are required.',
    });
    return;
  }

  try {
    const existing = await Department.findOne({
      name: name.trim(),
      program: program.trim(),
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'Department already exists for this program.' });
      return;
    }

    const dept = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      program: program.trim(),
    });

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_DEPARTMENT',
      'DEPARTMENT',
      dept._id.toString(),
      { name, code, program },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: dept,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create department.',
      errors: [error.message],
    });
  }
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const dept = await Department.findByIdAndDelete(id);
    if (!dept) {
      res.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete department.',
      errors: [error.message],
    });
  }
}
