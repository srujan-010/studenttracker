import { Request, Response } from 'express';
import { Program } from '../models/Program';
import { logAuditEvent } from '../middleware/audit';

export async function getPrograms(req: Request, res: Response): Promise<void> {
  try {
    let programs = await Program.find().sort({ durationYears: -1, name: 1 }).lean();

    // Default initialization if empty
    if (programs.length === 0) {
      const defaultPrograms = [
        {
          name: 'B.Tech',
          code: 'BTECH',
          durationYears: 4,
          totalSemesters: 8,
          departments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        },
        {
          name: 'BBA',
          code: 'BBA',
          durationYears: 3,
          totalSemesters: 6,
          departments: ['Business Administration', 'Marketing', 'Finance'],
        },
        {
          name: 'B.Sc',
          code: 'BSC',
          durationYears: 3,
          totalSemesters: 6,
          departments: ['Computer Science', 'Data Science', 'Mathematics'],
        },
      ];
      await Program.insertMany(defaultPrograms);
      programs = await Program.find().sort({ durationYears: -1, name: 1 }).lean();
    }

    res.json({
      success: true,
      data: programs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve academic programs.',
      errors: [error.message],
    });
  }
}

export async function createProgram(req: Request, res: Response): Promise<void> {
  const { name, code, durationYears, totalSemesters, departments } = req.body;

  if (!name || !code || !durationYears || !totalSemesters) {
    res.status(400).json({
      success: false,
      message: 'Program name, code, duration in years, and total semesters are required.',
    });
    return;
  }

  try {
    const existing = await Program.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Program with this code already exists.' });
      return;
    }

    const program = await Program.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      durationYears: Number(durationYears),
      totalSemesters: Number(totalSemesters),
      departments: Array.isArray(departments) ? departments.map((d: string) => d.trim()) : [],
    });

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_PROGRAM',
      'PROGRAM',
      program._id.toString(),
      { name, code, durationYears, totalSemesters },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Academic Program created successfully.',
      data: program,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create academic program.',
      errors: [error.message],
    });
  }
}

export async function deleteProgram(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const program = await Program.findByIdAndDelete(id);
    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found.' });
      return;
    }

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'DELETE_PROGRAM',
      'PROGRAM',
      id,
      { name: program.name, code: program.code },
      req.ip
    );

    res.json({
      success: true,
      message: 'Program deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete program.',
      errors: [error.message],
    });
  }
}
