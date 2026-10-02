import mongoose, { Document, Schema } from 'mongoose';

export interface IParticipationRecord extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  date: Date;
  obtainedScore: number;
  maximumScore: number;
  teacherId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipationRecordSchema = new Schema<IParticipationRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    obtainedScore: { type: Number, required: true, min: 0 },
    maximumScore: { type: Number, required: true, min: 1 },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

ParticipationRecordSchema.index({ studentId: 1, date: -1 });
ParticipationRecordSchema.index({ classId: 1, subjectId: 1, date: 1 });

export const ParticipationRecord = mongoose.model<IParticipationRecord>(
  'ParticipationRecord',
  ParticipationRecordSchema
);
