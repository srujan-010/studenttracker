import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { AcademicRecord } from '../models/AcademicRecord';
import { Prediction } from '../models/Prediction';
import { SystemSettings } from '../models/SystemSettings';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { mlClientService } from '../services/mlClientService';
import { studentMetricService } from '../services/studentMetricService';
import { analyzeRiskFactors } from '../services/riskFactorService';
import { generateRecommendations } from '../services/recommendationService';
import { logAuditEvent } from '../middleware/audit';
import { FeatureInputs, RiskLevel } from '@eduguard/shared';

export async function generatePrediction(req: Request, res: Response): Promise<void> {
  const { studentId, features } = req.body;

  if (!studentId) {
    res.status(400).json({ success: false, message: 'Student ID is required.' });
    return;
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    // Resolve feature values: either explicit from request or computed from real underlying student records
    let inputFeatures: FeatureInputs;

    if (features) {
      inputFeatures = {
        attendance: Number(features.attendance),
        previousScore: Number(features.previousScore),
        internalMarks: Number(features.internalMarks),
        assignmentCompletion: Number(features.assignmentCompletion),
        studyHours: Number(features.studyHours),
        participation: Number(features.participation),
      };
    } else {
      const metricResult = await studentMetricService.calculateStudentMetrics(student._id);
      inputFeatures = metricResult.featureInputs;
    }

    // Validate feature ranges
    const validationErrors: string[] = [];
    if (isNaN(inputFeatures.attendance) || inputFeatures.attendance < 0 || inputFeatures.attendance > 100) {
      validationErrors.push('Attendance must be between 0 and 100%');
    }
    if (isNaN(inputFeatures.previousScore) || inputFeatures.previousScore < 0 || inputFeatures.previousScore > 100) {
      validationErrors.push('Previous score must be between 0 and 100');
    }
    if (isNaN(inputFeatures.internalMarks) || inputFeatures.internalMarks < 0 || inputFeatures.internalMarks > 100) {
      validationErrors.push('Internal marks must be between 0 and 100');
    }
    if (isNaN(inputFeatures.assignmentCompletion) || inputFeatures.assignmentCompletion < 0 || inputFeatures.assignmentCompletion > 100) {
      validationErrors.push('Assignment completion must be between 0 and 100%');
    }
    if (isNaN(inputFeatures.participation) || inputFeatures.participation < 0 || inputFeatures.participation > 100) {
      validationErrors.push('Participation must be between 0 and 100%');
    }
    if (isNaN(inputFeatures.studyHours) || inputFeatures.studyHours < 0 || inputFeatures.studyHours > 100) {
      validationErrors.push('Study hours must be between 0 and 100 hrs/week');
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid feature values provided.',
        errors: validationErrors,
      });
      return;
    }

    // Load active institutional risk thresholds
    const settings = await (SystemSettings as any).getOrCreateSettings();
    const thresholds = settings.riskThresholds;

    // Call Python FastAPI ML Service
    const mlResult = await mlClientService.predict(inputFeatures);

    // Clamp predicted score between 0 and 100
    const rawScore = Number(mlResult.predictedScore);
    const predictedScore = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

    // Dynamic Risk Classification based on institutional thresholds
    let riskLevel: RiskLevel = 'LOW';
    if (predictedScore < thresholds.highRiskBelow) {
      riskLevel = 'HIGH';
    } else if (predictedScore < thresholds.mediumRiskBelow) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // Transparent Factor Analysis
    const riskFactors = analyzeRiskFactors(inputFeatures, thresholds);

    // Supportive Guidance Recommendations
    const recommendations = generateRecommendations(riskLevel, predictedScore, riskFactors);

    // Store Prediction Snapshot for full historical reproducibility
    const prediction = await Prediction.create({
      studentId: student._id,
      modelVersion: mlResult.modelVersion || settings.activeModelVersion,
      inputSnapshot: inputFeatures,
      predictedScore,
      riskLevel,
      riskFactors,
      recommendations,
      thresholdSnapshot: thresholds,
      createdBy: req.user?.id,
    });

    // Check if risk alert notification is needed
    if (riskLevel === 'HIGH') {
      // Find institutional admins and teachers
      const adminUsers = await User.find({ role: 'ADMIN', status: 'ACTIVE' }).limit(5);
      for (const admin of adminUsers) {
        await Notification.create({
          recipientId: admin._id,
          type: 'RISK_ALERT',
          title: `High Risk Alert: ${student.name}`,
          message: `Student ${student.name} (${student.studentId}) in ${student.department} has been identified with Predicted Score ${predictedScore.toFixed(1)} and marked as High Risk.`,
          relatedStudentId: student._id,
          relatedPredictionId: prediction._id,
        });
      }
    }

    // Audit Log
    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'GENERATE_PREDICTION',
      'PREDICTION',
      prediction._id.toString(),
      {
        studentId: student.studentId,
        predictedScore,
        riskLevel,
        modelVersion: mlResult.modelVersion,
      },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'AI prediction and risk analysis completed successfully.',
      data: {
        _id: prediction._id,
        studentId: student._id,
        studentName: student.name,
        predictedScore,
        riskLevel,
        riskFactors,
        recommendations,
        modelVersion: mlResult.modelVersion,
        thresholdSnapshot: thresholds,
        inputSnapshot: inputFeatures,
        createdAt: prediction.createdAt,
      },
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to generate prediction.',
      errors: [error.message],
    });
  }
}

export async function getPredictions(req: Request, res: Response): Promise<void> {
  const { studentId, riskLevel, page = '1', limit = '20' } = req.query;

  try {
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (riskLevel && riskLevel !== 'ALL') query.riskLevel = riskLevel;

    const total = await Prediction.countDocuments(query);
    const predictions = await Prediction.find(query)
      .populate('studentId', 'studentId name department section semester')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: predictions,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve predictions.',
      errors: [error.message],
    });
  }
}
