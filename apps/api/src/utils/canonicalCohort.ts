import mongoose from 'mongoose';
import { Department, IDepartment } from '../models/Department';
import { Program, IProgram } from '../models/Program';

export interface ResolvedCohort {
  program?: {
    id: string;
    name: string;
    code: string;
    durationYears: number;
    namesToMatch: string[];
  };
  department?: {
    id: string;
    name: string;
    code: string;
    namesToMatch: string[];
  };
  year?: number;
  semester?: number;
  section?: string;
}

/**
 * Standard department code and alias map
 */
const DEPARTMENT_ALIASES: Record<string, { name: string; code: string; program?: string }> = {
  // B.Tech
  'CSE': { name: 'Computer Science', code: 'CSE', program: 'B.Tech' },
  'COMPUTER SCIENCE': { name: 'Computer Science', code: 'CSE', program: 'B.Tech' },
  'COMPUTER SCIENCE ENGINEERING': { name: 'Computer Science', code: 'CSE', program: 'B.Tech' },
  'ECE': { name: 'Electronics', code: 'ECE', program: 'B.Tech' },
  'ELECTRONICS': { name: 'Electronics', code: 'ECE', program: 'B.Tech' },
  'ELECTRONICS & COMMUNICATION': { name: 'Electronics', code: 'ECE', program: 'B.Tech' },
  'ELECTRONICS AND COMMUNICATION': { name: 'Electronics', code: 'ECE', program: 'B.Tech' },
  'EEE': { name: 'Electrical', code: 'EEE', program: 'B.Tech' },
  'ELECTRICAL': { name: 'Electrical', code: 'EEE', program: 'B.Tech' },
  'ELECTRICAL & ELECTRONICS': { name: 'Electrical', code: 'EEE', program: 'B.Tech' },
  'ME': { name: 'Mechanical', code: 'ME', program: 'B.Tech' },
  'MECHANICAL': { name: 'Mechanical', code: 'ME', program: 'B.Tech' },
  'MECHANICAL ENGINEERING': { name: 'Mechanical', code: 'ME', program: 'B.Tech' },
  'CE': { name: 'Civil', code: 'CE', program: 'B.Tech' },
  'CIVIL': { name: 'Civil', code: 'CE', program: 'B.Tech' },
  'CIVIL ENGINEERING': { name: 'Civil', code: 'CE', program: 'B.Tech' },

  // BBA
  'BBA': { name: 'Business Administration', code: 'BBA', program: 'BBA' },
  'BUSINESS ADMINISTRATION': { name: 'Business Administration', code: 'BBA', program: 'BBA' },
  'MANAGEMENT': { name: 'Business Administration', code: 'BBA', program: 'BBA' },

  // B.Sc
  'BSC-CS': { name: 'Computer Science', code: 'BSC-CS', program: 'B.Sc' },
  'BSC-MATH': { name: 'Mathematics', code: 'BSC-MATH', program: 'B.Sc' },
  'MATHEMATICS': { name: 'Mathematics', code: 'BSC-MATH', program: 'B.Sc' },
  'MATH': { name: 'Mathematics', code: 'BSC-MATH', program: 'B.Sc' },
  'BSC-PHYS': { name: 'Physics', code: 'BSC-PHYS', program: 'B.Sc' },
  'PHYSICS': { name: 'Physics', code: 'BSC-PHYS', program: 'B.Sc' },
};

/**
 * Standard program code and alias map
 */
const PROGRAM_ALIASES: Record<string, { name: string; code: string }> = {
  'BTECH': { name: 'B.Tech', code: 'BTECH' },
  'B.TECH': { name: 'B.Tech', code: 'BTECH' },
  'B TECH': { name: 'B.Tech', code: 'BTECH' },
  'BBA': { name: 'BBA', code: 'BBA' },
  'BSC': { name: 'B.Sc', code: 'BSC' },
  'B.SC': { name: 'B.Sc', code: 'BSC' },
  'B SC': { name: 'B.Sc', code: 'BSC' },
};

export async function resolveCanonicalCohort(params: {
  program?: string;
  programId?: string;
  department?: string;
  departmentId?: string;
  year?: string | number;
  semester?: string | number;
  section?: string;
}): Promise<ResolvedCohort> {
  const result: ResolvedCohort = {};

  // 1. Resolve Program
  const rawProg = (params.programId || params.program || '').trim();
  if (rawProg && rawProg !== 'ALL') {
    let progDoc: IProgram | null = null;
    if (mongoose.Types.ObjectId.isValid(rawProg)) {
      progDoc = await Program.findById(rawProg);
    }
    if (!progDoc) {
      progDoc = await Program.findOne({
        $or: [
          { code: rawProg.toUpperCase() },
          { name: new RegExp(`^${rawProg}$`, 'i') },
        ],
      });
    }

    if (progDoc) {
      result.program = {
        id: progDoc._id.toString(),
        name: progDoc.name,
        code: progDoc.code,
        durationYears: progDoc.durationYears,
        namesToMatch: Array.from(new Set([progDoc.name, progDoc.code, rawProg])),
      };
    } else {
      const alias = PROGRAM_ALIASES[rawProg.toUpperCase()];
      if (alias) {
        result.program = {
          id: '',
          name: alias.name,
          code: alias.code,
          durationYears: alias.name === 'B.Tech' ? 4 : 3,
          namesToMatch: Array.from(new Set([alias.name, alias.code, rawProg])),
        };
      } else {
        result.program = {
          id: '',
          name: rawProg,
          code: rawProg.toUpperCase(),
          durationYears: 4,
          namesToMatch: [rawProg],
        };
      }
    }
  }

  // 2. Resolve Department
  const rawDept = (params.departmentId || params.department || '').trim();
  if (rawDept && rawDept !== 'ALL') {
    let deptDoc: IDepartment | null = null;
    if (mongoose.Types.ObjectId.isValid(rawDept)) {
      deptDoc = await Department.findById(rawDept);
    }
    if (!deptDoc) {
      // Check alias first for immediate code matching (e.g. ECE -> Electronics)
      const alias = DEPARTMENT_ALIASES[rawDept.toUpperCase()];
      const searchConditions: any[] = [
        { code: rawDept.toUpperCase() },
        { name: new RegExp(`^${rawDept}$`, 'i') },
      ];
      if (alias) {
        searchConditions.push({ name: alias.name });
        searchConditions.push({ code: alias.code });
      }

      const query: any = { $or: searchConditions };
      if (result.program?.name) {
        query.program = result.program.name;
      }
      deptDoc = await Department.findOne(query);

      // If not found with program, try without program restriction
      if (!deptDoc) {
        deptDoc = await Department.findOne({ $or: searchConditions });
      }
    }

    if (deptDoc) {
      result.department = {
        id: deptDoc._id.toString(),
        name: deptDoc.name,
        code: deptDoc.code,
        namesToMatch: Array.from(
          new Set([deptDoc.name, deptDoc.code, rawDept, rawDept.toUpperCase()])
        ),
      };
    } else {
      const alias = DEPARTMENT_ALIASES[rawDept.toUpperCase()];
      if (alias) {
        result.department = {
          id: '',
          name: alias.name,
          code: alias.code,
          namesToMatch: Array.from(new Set([alias.name, alias.code, rawDept])),
        };
      } else {
        result.department = {
          id: '',
          name: rawDept,
          code: rawDept.toUpperCase(),
          namesToMatch: [rawDept],
        };
      }
    }
  }

  // 3. Resolve Year
  if (params.year && params.year !== 'ALL') {
    const y = parseInt(params.year as string, 10);
    if (!isNaN(y)) result.year = y;
  }

  // 4. Resolve Semester
  if (params.semester && params.semester !== 'ALL') {
    const s = parseInt(params.semester as string, 10);
    if (!isNaN(s)) result.semester = s;
  }

  // 5. Resolve Section
  if (params.section && params.section !== 'ALL') {
    result.section = params.section.trim().toUpperCase();
  }

  return result;
}

/**
 * Builds a comprehensive MongoDB query object for students based on resolved cohort
 */
export function buildStudentQuery(resolved: ResolvedCohort, baseQuery: any = { status: 'ACTIVE' }): any {
  const query = { ...baseQuery };

  if (resolved.program) {
    query.$or = [
      { program: { $in: resolved.program.namesToMatch } },
      { course: { $in: resolved.program.namesToMatch } },
    ];
  }

  if (resolved.department) {
    const deptMatch = { department: { $in: resolved.department.namesToMatch } };
    if (query.$or) {
      query.$and = [{ $or: query.$or }, deptMatch];
      delete query.$or;
    } else {
      query.department = deptMatch.department;
    }
  }

  if (resolved.year !== undefined) {
    query.year = resolved.year;
  }

  if (resolved.semester !== undefined) {
    query.semester = resolved.semester;
  }

  if (resolved.section) {
    query.section = resolved.section;
  }

  return query;
}
