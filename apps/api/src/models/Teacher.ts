import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacher extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  department: string;
  assignedSubjects: mongoose.Types.ObjectId[];
  assignedClasses: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    department: { type: String, required: true, trim: true, index: true },
    assignedSubjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    assignedClasses: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
  },
  {
    timestamps: true,
  }
);

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
