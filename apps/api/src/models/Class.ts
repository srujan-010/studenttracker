import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  name: string;
  program: string;
  department: string;
  academicYear: string;
  year?: number;
  semester: number;
  section: string;
  teacherIds: mongoose.Types.ObjectId[];
  subjectIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, trim: true },
    program: { type: String, required: true, default: 'B.Tech', trim: true, index: true },
    department: { type: String, required: true, trim: true, index: true },
    academicYear: { type: String, required: true, trim: true },
    year: { type: Number, min: 1, max: 6 },
    semester: { type: Number, required: true, min: 1, max: 12, index: true },
    section: { type: String, required: true, uppercase: true, trim: true },
    teacherIds: [{ type: Schema.Types.ObjectId, ref: 'Teacher' }],
    subjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
  },
  {
    timestamps: true,
  }
);

ClassSchema.index({ program: 1, department: 1, academicYear: 1, semester: 1, section: 1 }, { unique: true });

export const Class = mongoose.model<IClass>('Class', ClassSchema);
