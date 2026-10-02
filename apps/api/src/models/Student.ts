import mongoose, { Document, Schema } from 'mongoose';
import { StudentStatus } from '@eduguard/shared';

export interface IStudent extends Document {
  studentId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  program: string;
  department: string;
  course: string;
  year: number;
  section: string;
  academicYear: string;
  semester: number;
  enrollmentDate?: Date;
  status: StudentStatus;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    program: { type: String, required: true, default: 'B.Tech', trim: true, index: true },
    department: { type: String, required: true, trim: true, index: true },
    course: { type: String, required: true, default: 'B.Tech', trim: true },
    year: { type: Number, required: true, min: 1, max: 6 },
    section: { type: String, required: true, uppercase: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 12, index: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'], default: 'ACTIVE', index: true },
    profileImage: { type: String },
  },
  {
    timestamps: true,
  }
);

StudentSchema.index({ department: 1, semester: 1, section: 1 });
StudentSchema.index({ program: 1, department: 1, year: 1, semester: 1, section: 1 });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
