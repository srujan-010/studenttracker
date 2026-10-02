import mongoose, { Document, Schema } from 'mongoose';
import { AssignmentStatus } from '@eduguard/shared';

export interface IAssignment extends Document {
  studentId?: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  maximumMarks?: number;
  teacherId?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  status?: AssignmentStatus;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    maximumMarks: { type: Number, default: 100, min: 1 },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    status: { type: String, enum: ['PENDING', 'SUBMITTED', 'GRADED', 'LATE'], default: 'PENDING' },
    score: { type: Number, min: 0, max: 100 },
  },
  {
    timestamps: true,
  }
);

AssignmentSchema.index({ classId: 1, subjectId: 1 });
AssignmentSchema.index({ dueDate: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);

