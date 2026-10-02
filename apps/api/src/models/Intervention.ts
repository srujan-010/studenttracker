import mongoose, { Document, Schema } from 'mongoose';
import { InterventionPriority, InterventionStatus, InterventionType } from '@eduguard/shared';

export interface IIntervention extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  predictionId?: mongoose.Types.ObjectId;
  type: InterventionType;
  title: string;
  description: string;
  priority: InterventionPriority;
  status: InterventionStatus;
  dueDate: Date;
  completedAt?: Date;
  outcome?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InterventionSchema = new Schema<IIntervention>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    predictionId: { type: Schema.Types.ObjectId, ref: 'Prediction' },
    type: {
      type: String,
      enum: [
        'ACADEMIC_COUNSELING',
        'REMEDIAL_SUPPORT',
        'ASSIGNMENT_FOLLOWUP',
        'ATTENDANCE_FOLLOWUP',
        'STUDY_PLANNING',
        'FACULTY_MEETING',
        'OTHER',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'OPEN', index: true },
    dueDate: { type: Date, required: true, index: true },
    completedAt: { type: Date },
    outcome: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

InterventionSchema.index({ studentId: 1, status: 1 });

export const Intervention = mongoose.model<IIntervention>('Intervention', InterventionSchema);
