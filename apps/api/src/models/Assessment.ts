import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessment extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  academicYear: string;
  semester: number;
  assessmentType: string;
  title?: string;
  obtainedMarks: number;
  maximumMarks: number;
  date: Date;
  markedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', index: true },
    academicYear: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 10, index: true },
    assessmentType: {
      type: String,
      required: true,
      enum: [
        'Mid 1',
        'Mid 2',
        'Internal Lab 1',
        'Internal Lab 2',
        'External Lab',
        'Assignment',
        'Internal Assessment 1',
        'Internal Assessment 2',
        'Mid Examination',
        'Other',
      ],
    },
    title: { type: String, trim: true },
    obtainedMarks: { type: Number, required: true, min: 0 },
    maximumMarks: { type: Number, required: true, min: 0.1 },
    date: { type: Date, required: true, default: Date.now },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

AssessmentSchema.index({ studentId: 1, subjectId: 1, semester: 1 });
AssessmentSchema.index({ studentId: 1, date: -1 });

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
