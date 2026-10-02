import mongoose, { Document, Schema } from 'mongoose';
import { FeatureInputs, RiskFactor, RiskLevel, SystemRiskThresholds } from '@eduguard/shared';

export interface IPrediction extends Document {
  studentId: mongoose.Types.ObjectId;
  modelVersion: string;
  inputSnapshot: FeatureInputs;
  predictedScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  recommendations: string[];
  thresholdSnapshot: SystemRiskThresholds;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RiskFactorSchema = new Schema(
  {
    factor: { type: String, required: true },
    category: { type: String, required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    description: { type: String, required: true },
    observedValue: { type: Number },
    threshold: { type: Number },
  },
  { _id: false }
);

const PredictionSchema = new Schema<IPrediction>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    modelVersion: { type: String, required: true },
    inputSnapshot: {
      attendance: { type: Number, required: true },
      previousScore: { type: Number, required: true },
      internalMarks: { type: Number, required: true },
      assignmentCompletion: { type: Number, required: true },
      studyHours: { type: Number, required: true },
      participation: { type: Number, required: true },
    },
    predictedScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true, index: true },
    riskFactors: [RiskFactorSchema],
    recommendations: [{ type: String, required: true }],
    thresholdSnapshot: {
      highRiskBelow: { type: Number, default: 50.0 },
      mediumRiskBelow: { type: Number, default: 70.0 },
      attendanceThreshold: { type: Number, default: 75.0 },
      previousScoreThreshold: { type: Number, default: 55.0 },
      internalMarksThreshold: { type: Number, default: 50.0 },
      assignmentCompletionThreshold: { type: Number, default: 70.0 },
      studyHoursThreshold: { type: Number, default: 8.0 },
      participationThreshold: { type: Number, default: 50.0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

PredictionSchema.index({ studentId: 1, createdAt: -1 });
PredictionSchema.index({ riskLevel: 1, createdAt: -1 });

export const Prediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);
