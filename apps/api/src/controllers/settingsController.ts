import { Request, Response } from 'express';
import { SystemSettings } from '../models/SystemSettings';
import { ModelMetadata } from '../models/ModelMetadata';
import { logAuditEvent } from '../middleware/audit';

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await (SystemSettings as any).getOrCreateSettings();
    const modelMetadata = await ModelMetadata.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        settings,
        models: modelMetadata,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system settings.',
      errors: [error.message],
    });
  }
}

export async function updateRiskThresholds(req: Request, res: Response): Promise<void> {
  const {
    highRiskBelow,
    mediumRiskBelow,
    attendanceThreshold,
    previousScoreThreshold,
    internalMarksThreshold,
    assignmentCompletionThreshold,
    studyHoursThreshold,
    participationThreshold,
    institutionName,
    activeModelVersion,
  } = req.body;

  try {
    const settings = await (SystemSettings as any).getOrCreateSettings();

    if (institutionName) settings.institutionName = institutionName;
    if (activeModelVersion) settings.activeModelVersion = activeModelVersion;

    if (highRiskBelow !== undefined) settings.riskThresholds.highRiskBelow = Number(highRiskBelow);
    if (mediumRiskBelow !== undefined) settings.riskThresholds.mediumRiskBelow = Number(mediumRiskBelow);
    if (attendanceThreshold !== undefined) settings.riskThresholds.attendanceThreshold = Number(attendanceThreshold);
    if (previousScoreThreshold !== undefined) settings.riskThresholds.previousScoreThreshold = Number(previousScoreThreshold);
    if (internalMarksThreshold !== undefined) settings.riskThresholds.internalMarksThreshold = Number(internalMarksThreshold);
    if (assignmentCompletionThreshold !== undefined) settings.riskThresholds.assignmentCompletionThreshold = Number(assignmentCompletionThreshold);
    if (studyHoursThreshold !== undefined) settings.riskThresholds.studyHoursThreshold = Number(studyHoursThreshold);
    if (participationThreshold !== undefined) settings.riskThresholds.participationThreshold = Number(participationThreshold);

    settings.updatedBy = req.user?.id;
    await settings.save();

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'UPDATE_RISK_THRESHOLDS',
      'SYSTEM_SETTINGS',
      settings._id.toString(),
      { thresholds: settings.riskThresholds },
      req.ip
    );

    res.json({
      success: true,
      message: 'System risk thresholds updated successfully.',
      data: settings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings.',
      errors: [error.message],
    });
  }
}
