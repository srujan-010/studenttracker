import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicRecord extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  academicYear: string;
  semester: number;
  internalMarks: number;
  previousScore: number;
  assignmentCompletion: number;
  studyHours: number;
  participation: number;
  attendance: number;
  finalScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicRecordSchema = new Schema<IAcademicRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    academicYear: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 10, index: true },
    internalMarks: { type: Number, required: true, min: 0, max: 100 },
    previousScore: { type: Number, required: true, min: 0, max: 100 },
    assignmentCompletion: { type: Number, required: true, min: 0, max: 100 },
    studyHours: { type: Number, required: true, min: 0, max: 100 },
    participation: { type: Number, required: true, min: 0, max: 100 },
    attendance: { type: Number, required: true, min: 0, max: 100 },
    finalScore: { type: Number, min: 0, max: 100 },
  },
  {
    timestamps: true,
  }
);

AcademicRecordSchema.index({ studentId: 1, subjectId: 1, semester: 1 }, { unique: true });

export const AcademicRecord = mongoose.model<IAcademicRecord>('AcademicRecord', AcademicRecordSchema);
