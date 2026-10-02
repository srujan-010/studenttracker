import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { AcademicRecord } from '../models/AcademicRecord';
import { Prediction } from '../models/Prediction';
import { Intervention } from '../models/Intervention';

export async function getStudentReport(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const student = await Student.findById(id).lean();
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    const [academicRecords, latestPrediction, interventions] = await Promise.all([
      AcademicRecord.find({ studentId: student._id }).populate('subjectId').sort({ semester: 1 }).lean(),
      Prediction.findOne({ studentId: student._id }).sort({ createdAt: -1 }).lean(),
      Intervention.find({ studentId: student._id })
        .populate({ path: 'teacherId', populate: { path: 'userId', select: 'name email' } })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Compute academic summary aggregates
    const totalRecords = academicRecords.length;
    const avgAttendance =
      totalRecords > 0
        ? Math.round((academicRecords.reduce((acc, r) => acc + r.attendance, 0) / totalRecords) * 10) / 10
        : 0;
    const avgScore =
      totalRecords > 0
        ? Math.round(
            (academicRecords.reduce((acc, r) => acc + (r.internalMarks + r.previousScore) / 2, 0) / totalRecords) *
              10
          ) / 10
        : 0;

    res.json({
      success: true,
      data: {
        student,
        academicSummary: {
          totalSubjects: totalRecords,
          averageAttendance: avgAttendance,
          averageAcademicScore: avgScore,
        },
        subjectPerformance: academicRecords.map((r: any) => ({
          subjectName: r.subjectId?.name || 'Subject',
          subjectCode: r.subjectId?.code || 'CODE',
          internalMarks: r.internalMarks,
          previousScore: r.previousScore,
          attendance: r.attendance,
          studyHours: r.studyHours,
          assignmentCompletion: r.assignmentCompletion,
        })),
        aiPrediction: latestPrediction
          ? {
              predictedScore: latestPrediction.predictedScore,
              riskLevel: latestPrediction.riskLevel,
              modelVersion: latestPrediction.modelVersion,
              createdAt: latestPrediction.createdAt,
              riskFactors: latestPrediction.riskFactors,
              recommendations: latestPrediction.recommendations,
              inputSnapshot: latestPrediction.inputSnapshot,
            }
          : null,
        interventions,
        generatedAt: new Date(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate student report.',
      errors: [error.message],
    });
  }
}

export async function getClassRiskReport(req: Request, res: Response): Promise<void> {
  const { department, semester, section } = req.query;

  try {
    const studentQuery: any = { status: 'ACTIVE' };
    if (department) studentQuery.department = department;
    if (semester) studentQuery.semester = parseInt(semester as string, 10);
    if (section) studentQuery.section = (section as string).toUpperCase();

    const students = await Student.find(studentQuery).lean();
    const studentIds = students.map((s) => s._id);

    const latestPredictions = await Prediction.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$studentId',
          latest: { $first: '$$ROOT' },
        },
      },
    ]);

    const predictionMap = new Map();
    latestPredictions.forEach((p) => predictionMap.set(p._id.toString(), p.latest));

    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    let scoreSum = 0;

    const studentList = students.map((s) => {
      const pred = predictionMap.get(s._id.toString());
      if (pred) {
        if (pred.riskLevel === 'HIGH') highRiskCount++;
        else if (pred.riskLevel === 'MEDIUM') mediumRiskCount++;
        else lowRiskCount++;
        scoreSum += pred.predictedScore;
      }
      return {
        _id: s._id,
        studentId: s.studentId,
        name: s.name,
        department: s.department,
        semester: s.semester,
        section: s.section,
        prediction: pred || null,
      };
    });

    const averagePredictedScore =
      latestPredictions.length > 0 ? Math.round((scoreSum / latestPredictions.length) * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        predictedStudentsCount: latestPredictions.length,
        averagePredictedScore,
        riskDistribution: {
          highRisk: highRiskCount,
          mediumRisk: mediumRiskCount,
          lowRisk: lowRiskCount,
        },
        students: studentList,
        generatedAt: new Date(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate class risk report.',
      errors: [error.message],
    });
  }
}
