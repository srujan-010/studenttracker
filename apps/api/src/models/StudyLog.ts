import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyLog extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  topicsCovered?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudyLogSchema = new Schema<IStudyLog>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    date: { type: Date, required: true, default: Date.now, index: true },
    hours: { type: Number, required: true, min: 0, max: 24 },
    topicsCovered: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

StudyLogSchema.index({ studentId: 1, date: -1 });

export const StudyLog = mongoose.model<IStudyLog>('StudyLog', StudyLogSchema);
