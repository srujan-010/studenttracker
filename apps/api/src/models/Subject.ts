import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  credits: number;
  program: string;
  department: string;
  semester: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    credits: { type: Number, required: true, min: 1, max: 10 },
    program: { type: String, required: true, default: 'B.Tech', trim: true, index: true },
    department: { type: String, required: true, trim: true, index: true },
    semester: { type: Number, required: true, min: 1, max: 10, index: true },
  },
  {
    timestamps: true,
  }
);

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
