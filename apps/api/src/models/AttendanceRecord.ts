import mongoose, { Document, Schema } from 'mongoose';
import { AttendanceStatus } from '@eduguard/shared';

export interface IAttendanceRecord extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  markedBy?: mongoose.Types.ObjectId;
  percentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', index: true },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    percentage: { type: Number, min: 0, max: 100 },
  },
  {
    timestamps: true,
  }
);

AttendanceRecordSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });
AttendanceRecordSchema.index({ classId: 1, subjectId: 1, date: 1 });
AttendanceRecordSchema.index({ studentId: 1, date: 1 });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);

