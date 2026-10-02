import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: 'SUBMITTED' | 'NOT_SUBMITTED' | 'LATE';
  submittedAt?: Date;
  obtainedMarks?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    status: {
      type: String,
      enum: ['SUBMITTED', 'NOT_SUBMITTED', 'LATE'],
      default: 'NOT_SUBMITTED',
      required: true,
    },
    submittedAt: { type: Date },
    obtainedMarks: { type: Number, min: 0 },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
AssignmentSubmissionSchema.index({ studentId: 1, status: 1 });

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>(
  'AssignmentSubmission',
  AssignmentSubmissionSchema
);
