import mongoose, { Document, Schema } from 'mongoose';
import { DEFAULT_RISK_THRESHOLDS, SystemRiskThresholds } from '@eduguard/shared';

export interface ISystemSettings extends Document {
  institutionName: string;
  academicYear: string;
  riskThresholds: SystemRiskThresholds;
  activeModelVersion: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    institutionName: { type: String, default: 'EduGuard Institute of Higher Learning' },
    academicYear: { type: String, default: '2025-2026' },
    riskThresholds: {
      highRiskBelow: { type: Number, default: DEFAULT_RISK_THRESHOLDS.highRiskBelow },
      mediumRiskBelow: { type: Number, default: DEFAULT_RISK_THRESHOLDS.mediumRiskBelow },
      attendanceThreshold: { type: Number, default: DEFAULT_RISK_THRESHOLDS.attendanceThreshold },
      previousScoreThreshold: { type: Number, default: DEFAULT_RISK_THRESHOLDS.previousScoreThreshold },
      internalMarksThreshold: { type: Number, default: DEFAULT_RISK_THRESHOLDS.internalMarksThreshold },
      assignmentCompletionThreshold: { type: Number, default: DEFAULT_RISK_THRESHOLDS.assignmentCompletionThreshold },
      studyHoursThreshold: { type: Number, default: DEFAULT_RISK_THRESHOLDS.studyHoursThreshold },
      participationThreshold: { type: Number, default: DEFAULT_RISK_THRESHOLDS.participationThreshold },
    },
    activeModelVersion: { type: String, default: 'v1.0.0' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Helper to get or create singleton system settings
SystemSettingsSchema.statics.getOrCreateSettings = async function (): Promise<ISystemSettings> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export interface SystemSettingsModel extends mongoose.Model<ISystemSettings> {
  getOrCreateSettings(): Promise<ISystemSettings>;
}

export const SystemSettings = mongoose.model<ISystemSettings, SystemSettingsModel>('SystemSettings', SystemSettingsSchema);
