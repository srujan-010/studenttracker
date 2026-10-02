import { FeatureInputs, RiskFactor, SystemRiskThresholds } from '@eduguard/shared';

/**
 * Transparent factor-analysis layer.
 * System avoids claiming AI 'knows' causation; instead identifies measurable
 * academic indicators falling below institutional reference thresholds.
 */
export function analyzeRiskFactors(
  inputs: FeatureInputs,
  thresholds: SystemRiskThresholds
): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Attendance check
  if (inputs.attendance < thresholds.attendanceThreshold) {
    const diff = thresholds.attendanceThreshold - inputs.attendance;
    factors.push({
      factor: 'Low Attendance Rate',
      category: 'ATTENDANCE',
      severity: diff > 20 ? 'HIGH' : diff > 10 ? 'MEDIUM' : 'LOW',
      description: `Observed attendance (${inputs.attendance.toFixed(1)}%) is below institutional reference threshold of ${thresholds.attendanceThreshold}%.`,
      observedValue: inputs.attendance,
      threshold: thresholds.attendanceThreshold,
    });
  }

  // Previous Academic Score check
  if (inputs.previousScore < thresholds.previousScoreThreshold) {
    const diff = thresholds.previousScoreThreshold - inputs.previousScore;
    factors.push({
      factor: 'Historical Examination Performance',
      category: 'HISTORICAL_PERFORMANCE',
      severity: diff > 20 ? 'HIGH' : diff > 10 ? 'MEDIUM' : 'LOW',
      description: `Previous score (${inputs.previousScore.toFixed(1)}) indicates foundational difficulty compared to standard benchmark (${thresholds.previousScoreThreshold}).`,
      observedValue: inputs.previousScore,
      threshold: thresholds.previousScoreThreshold,
    });
  }

  // Internal Assessment Marks check
  if (inputs.internalMarks < thresholds.internalMarksThreshold) {
    const diff = thresholds.internalMarksThreshold - inputs.internalMarks;
    factors.push({
      factor: 'Low Internal Assessment Marks',
      category: 'INTERNAL_ASSESSMENT',
      severity: diff > 20 ? 'HIGH' : diff > 10 ? 'MEDIUM' : 'LOW',
      description: `Internal assessment score (${inputs.internalMarks.toFixed(1)}) indicates learning gaps in ongoing coursework benchmark (${thresholds.internalMarksThreshold}).`,
      observedValue: inputs.internalMarks,
      threshold: thresholds.internalMarksThreshold,
    });
  }

  // Assignment Completion check
  if (inputs.assignmentCompletion < thresholds.assignmentCompletionThreshold) {
    const diff = thresholds.assignmentCompletionThreshold - inputs.assignmentCompletion;
    factors.push({
      factor: 'Low Assignment Completion Rate',
      category: 'ASSIGNMENT_COMPLETION',
      severity: diff > 25 ? 'HIGH' : diff > 10 ? 'MEDIUM' : 'LOW',
      description: `Assignment submission completion (${inputs.assignmentCompletion.toFixed(1)}%) is below expected completion threshold (${thresholds.assignmentCompletionThreshold}%).`,
      observedValue: inputs.assignmentCompletion,
      threshold: thresholds.assignmentCompletionThreshold,
    });
  }

  // Study Hours check
  if (inputs.studyHours < thresholds.studyHoursThreshold) {
    const diff = thresholds.studyHoursThreshold - inputs.studyHours;
    factors.push({
      factor: 'Limited Self-Study Hours',
      category: 'STUDY_HABITS',
      severity: diff > 4 ? 'HIGH' : 'MEDIUM',
      description: `Reported self-study time (${inputs.studyHours.toFixed(1)} hrs/week) is below recommended independent study target (${thresholds.studyHoursThreshold} hrs/week).`,
      observedValue: inputs.studyHours,
      threshold: thresholds.studyHoursThreshold,
    });
  }

  // Participation check
  if (inputs.participation < thresholds.participationThreshold) {
    const diff = thresholds.participationThreshold - inputs.participation;
    factors.push({
      factor: 'Low Classroom Participation',
      category: 'ENGAGEMENT',
      severity: diff > 25 ? 'HIGH' : 'LOW',
      description: `Course engagement & active classroom participation (${inputs.participation.toFixed(1)}%) is lower than typical baseline (${thresholds.participationThreshold}%).`,
      observedValue: inputs.participation,
      threshold: thresholds.participationThreshold,
    });
  }

  return factors;
}
