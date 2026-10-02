import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Class } from '../models/Class';
import { Prediction } from '../models/Prediction';
import { AcademicRecord } from '../models/AcademicRecord';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { Intervention } from '../models/Intervention';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  try {
    const { program, department, year, semester } = req.query;
    const isTeacher = req.user?.role === 'TEACHER';
    let authorizedStudentIds: mongoose.Types.ObjectId[] | null = null;

    if (isTeacher) {
      const teacher = await Teacher.findOne({ userId: req.user?.id });
      if (teacher && teacher.assignedClasses?.length) {
        const classes = await Class.find({ _id: { $in: teacher.assignedClasses } });
        const conditions = classes.map((c) => ({
          department: c.department,
          semester: c.semester,
          section: c.section,
        }));

        if (conditions.length > 0) {
          const students = await Student.find({ $or: conditions, status: 'ACTIVE' }).select('_id');
          authorizedStudentIds = students.map((s) => s._id as mongoose.Types.ObjectId);
        }
      }
    }

    // Base query for students with cohort filters
    const studentQuery: any = { status: 'ACTIVE' };
    if (program && program !== 'ALL') {
      studentQuery.$or = [{ program: program }, { course: program }];
    }
    if (department && department !== 'ALL') studentQuery.department = department;
    if (year && year !== 'ALL') studentQuery.year = parseInt(year as string, 10);
    if (semester && semester !== 'ALL') studentQuery.semester = parseInt(semester as string, 10);

    if (authorizedStudentIds !== null) {
      if (studentQuery.$or) {
        studentQuery.$and = [{ $or: studentQuery.$or }, { _id: { $in: authorizedStudentIds } }];
        delete studentQuery.$or;
      } else {
        studentQuery._id = { $in: authorizedStudentIds };
      }
    }

    // Matching students
    const matchedStudents = await Student.find(studentQuery)
      .select('name studentId department section semester year program course')
      .lean();
    const matchedStudentIds = matchedStudents.map((s) => s._id);

    // Counts
    const [totalTeachers, activeClasses] = await Promise.all([
      Teacher.countDocuments(),
      Class.countDocuments(),
    ]);
    const totalStudents = matchedStudents.length;

    // Aggregate Latest Prediction per Student
    const predictionMatch: any = { studentId: { $in: matchedStudentIds } };

    const latestPredictions = await Prediction.aggregate([
      { $match: predictionMatch },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$studentId',
          latestPrediction: { $first: '$$ROOT' },
        },
      },
    ]);

    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    let totalScoreSum = 0;

    latestPredictions.forEach((item) => {
      const p = item.latestPrediction;
      if (p.riskLevel === 'HIGH') highRiskCount++;
      else if (p.riskLevel === 'MEDIUM') mediumRiskCount++;
      else lowRiskCount++;

      totalScoreSum += p.predictedScore || 0;
    });

    const averagePredictedScore =
      latestPredictions.length > 0
        ? Math.round((totalScoreSum / latestPredictions.length) * 10) / 10
        : 0;

    // Match criteria for student scoped queries
    const academicRecordMatch: any = { studentId: { $in: matchedStudentIds } };

    // Average Attendance Aggregation from real AttendanceRecord collection
    const attendanceStats = await AttendanceRecord.aggregate([
      { $match: academicRecordMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
          },
        },
      },
    ]);

    let averageAttendance = 0;
    if (attendanceStats.length > 0 && attendanceStats[0].total > 0) {
      averageAttendance =
        Math.round((attendanceStats[0].present / attendanceStats[0].total) * 1000) / 10;
    } else {
      const attendanceAgg = await AcademicRecord.aggregate([
        { $match: academicRecordMatch },
        {
          $group: {
            _id: null,
            avgAttendance: { $avg: '$attendance' },
          },
        },
      ]);
      averageAttendance =
        attendanceAgg.length > 0
          ? Math.round((attendanceAgg[0].avgAttendance || 0) * 10) / 10
          : 0;
    }

    // Intervention Completion Rate
    const interventionMatch: any = { studentId: { $in: matchedStudentIds } };

    const [totalInterventions, completedInterventions] = await Promise.all([
      Intervention.countDocuments(interventionMatch),
      Intervention.countDocuments({ ...interventionMatch, status: 'COMPLETED' }),
    ]);

    const interventionCompletionRate =
      totalInterventions > 0
        ? Math.round((completedInterventions / totalInterventions) * 100)
        : 0;

    // Risk Distribution for Donut Chart
    const riskDistribution = [
      { name: 'Low Risk', value: lowRiskCount, color: '#10b981' },
      { name: 'Medium Risk', value: mediumRiskCount, color: '#f59e0b' },
      { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
    ];

    // Performance Trend Aggregated by Semester
    const performanceTrendAgg = await AcademicRecord.aggregate([
      { $match: academicRecordMatch },
      {
        $group: {
          _id: '$semester',
          avgInternalMarks: { $avg: '$internalMarks' },
          avgPreviousScore: { $avg: '$previousScore' },
          studentCount: { $addToSet: '$studentId' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const performanceTrend = performanceTrendAgg.map((item) => ({
      period: `Semester ${item._id}`,
      averageScore: Math.round(((item.avgInternalMarks + item.avgPreviousScore) / 2) * 10) / 10,
      studentCount: item.studentCount.length,
    }));

    // Scatter Data: Attendance vs Predicted Score
    const studentInfoMap = new Map();
    const students = await Student.find(studentQuery).select('name studentId department section semester year program course').lean();
    students.forEach((s) => studentInfoMap.set(s._id.toString(), s));

    const attendanceVsPerformance: any[] = [];
    latestPredictions.forEach((lp) => {
      const p = lp.latestPrediction;
      const s = studentInfoMap.get(p.studentId.toString());
      if (s) {
        attendanceVsPerformance.push({
          studentName: s.name,
          studentId: s.studentId,
          attendance: Math.round(p.inputSnapshot.attendance * 10) / 10,
          predictedScore: Math.round(p.predictedScore * 10) / 10,
          riskLevel: p.riskLevel,
        });
      }
    });

    // Students Requiring Attention (High & Medium risk, sorted by High first and lowest predicted score)
    const highAndMedium = latestPredictions
      .filter((lp) => lp.latestPrediction.riskLevel === 'HIGH' || lp.latestPrediction.riskLevel === 'MEDIUM')
      .sort((a, b) => a.latestPrediction.predictedScore - b.latestPrediction.predictedScore)
      .slice(0, 15);

    const highAndMediumStudentIds = highAndMedium.map((lp) => lp.latestPrediction.studentId);
    const recentInterventions = await Intervention.find({
      studentId: { $in: highAndMediumStudentIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const interventionStatusMap = new Map();
    recentInterventions.forEach((inv) => {
      if (!interventionStatusMap.has(inv.studentId.toString())) {
        interventionStatusMap.set(inv.studentId.toString(), inv.status);
      }
    });

    const studentsRequiringAttention = highAndMedium.map((lp) => {
      const p = lp.latestPrediction;
      const s = studentInfoMap.get(p.studentId.toString()) || {};
      const topFactor = p.riskFactors && p.riskFactors.length > 0 ? p.riskFactors[0].factor : 'Academic Variability';

      const studentYear = s.year || Math.ceil((s.semester || 1) / 2);

      return {
        _id: s._id || p.studentId,
        studentId: s.studentId || 'N/A',
        name: s.name || 'Unknown',
        program: s.program || s.course || 'B.Tech',
        year: studentYear,
        yearLabel: `${studentYear} Year`,
        semester: s.semester || 1,
        section: s.section || 'A',
        department: s.department || 'N/A',
        className: s.department ? `${s.department} Sem ${s.semester}-${s.section}` : 'N/A',
        predictedScore: p.predictedScore,
        riskLevel: p.riskLevel,
        topRiskFactor: topFactor,
        lastInterventionStatus: interventionStatusMap.get(p.studentId.toString()) || 'NO_INTERVENTION',
        attendance: p.inputSnapshot?.attendance ?? 0,
        previousScore: p.inputSnapshot?.previousScore ?? 0,
      };
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        activeClasses,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        averagePredictedScore,
        averageAttendance,
        interventionCompletionRate,
        riskDistribution,
        performanceTrend,
        attendanceVsPerformance,
        studentsRequiringAttention,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to aggregate dashboard summary metrics.',
      errors: [error.message],
    });
  }
}
