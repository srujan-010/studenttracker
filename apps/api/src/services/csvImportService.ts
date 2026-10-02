import { Readable } from 'stream';
import csvParser from 'csv-parser';

export interface CSVStudentRow {
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  course: string;
  year: string | number;
  section: string;
  academicYear: string;
  semester: string | number;
}

export interface CSVValidationResult {
  validCount: number;
  invalidCount: number;
  totalRows: number;
  validRows: any[];
  errors: { row: number; studentId?: string; error: string }[];
}

export async function parseAndValidateStudentCSV(buffer: Buffer): Promise<CSVValidationResult> {
  const rows: any[] = [];
  const errors: { row: number; studentId?: string; error: string }[] = [];
  const validRows: any[] = [];

  const stream = Readable.from(buffer).pipe(
    csvParser({
      mapHeaders: ({ header }) => header.trim(),
    })
  );

  let rowIndex = 1; // Row 1 is header, data rows start at row 2
  for await (const raw of stream) {
    rowIndex++;
    const row: CSVStudentRow = {
      studentId: (raw.studentId || raw['Student ID'] || raw['student_id'] || '').trim().toUpperCase(),
      name: (raw.name || raw['Name'] || raw['student_name'] || '').trim(),
      email: (raw.email || raw['Email'] || '').trim().toLowerCase(),
      phone: (raw.phone || raw['Phone'] || '').trim(),
      department: (raw.department || raw['Department'] || '').trim(),
      course: (raw.course || raw['Course'] || 'B.Tech').trim(),
      year: parseInt(raw.year || raw['Year'] || '1', 10),
      section: (raw.section || raw['Section'] || 'A').trim().toUpperCase(),
      academicYear: (raw.academicYear || raw['Academic Year'] || raw['academic_year'] || '2025-2026').trim(),
      semester: parseInt(raw.semester || raw['Semester'] || '1', 10),
    };

    // Validation checks
    const rowErrors: string[] = [];

    if (!row.studentId) rowErrors.push('Missing Student ID');
    if (!row.name) rowErrors.push('Missing Student Name');
    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      rowErrors.push('Invalid or missing Email address');
    }
    if (!row.department) rowErrors.push('Missing Department');
    if (isNaN(row.year as number) || (row.year as number) < 1 || (row.year as number) > 5) {
      rowErrors.push('Year must be between 1 and 5');
    }
    if (isNaN(row.semester as number) || (row.semester as number) < 1 || (row.semester as number) > 10) {
      rowErrors.push('Semester must be between 1 and 10');
    }
    if (!row.section) rowErrors.push('Missing Section');

    if (rowErrors.length > 0) {
      errors.push({
        row: rowIndex,
        studentId: row.studentId || `Row-${rowIndex}`,
        error: rowErrors.join('; '),
      });
    } else {
      validRows.push(row);
    }
  }

  return {
    validCount: validRows.length,
    invalidCount: errors.length,
    totalRows: validRows.length + errors.length,
    validRows,
    errors,
  };
}
