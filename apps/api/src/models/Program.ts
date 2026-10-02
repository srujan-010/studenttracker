import mongoose, { Document, Schema } from 'mongoose';

export interface IProgram extends Document {
  name: string;
  code: string;
  durationYears: number;
  totalSemesters: number;
  departments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    durationYears: { type: Number, required: true, min: 1, max: 6, default: 4 },
    totalSemesters: { type: Number, required: true, min: 1, max: 12, default: 8 },
    departments: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);
