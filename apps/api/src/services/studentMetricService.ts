import mongoose from 'mongoose';
import { Student } from '../models/Student';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { Assessment } from '../models/Assessment';
import { Assignment } from '../models/Assignment';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { StudyLog } from '../models/StudyLog';
import { ParticipationRecord } from '../models/ParticipationRecord';
import { AcademicRecord } from '../models/AcademicRecord';
import { Subject } from '../models/Subject';
import { Program } from '../models/Program';
import '../models/Class';
import '../models/User';
import {
  FeatureInputs,
  StudentCalculatedMetricsDTO,
  StudentFullAcademicHistoryDTO,
  YearAcademicHistory,
  SemesterAcademicHistory,
  SubjectAcademicHistory,
} from '@eduguard/shared';

export class StudentMetricService {
  /**
   * Calculate all 6 student metrics from underlying raw MongoDB records
   */
  async calculateStudentMetrics(studentId: string | mongoose.Types.ObjectId): Promise<StudentCalculatedMetricsDTO> {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error(`Student not found with ID: ${studentId}`);
    }

    const sId = student._id;

    // 1. ATTENDANCE CALCULATION
    const attendanceRecords = await AttendanceRecord.find({ studentId: sId })
      .populate('subjectId', 'name code')
      .sort({ date: -1 })
      .lean();

    const totalAttendanceCount = attendanceRecords.length;
    const presentAttendanceCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const absentAttendanceCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;

    let calculatedAttendance = 0;
    let attendanceSubtext = 'No attendance recorded';
    let attendanceFormula = '0 / 0 × 100 = 0%';

    // Subject-wise attendance calculation (Requirement 10 & 13)
    const subjectMap = new Map<string, { subjectId: string; name: string; code: string; total: number; present: number; absent: number; percentage: number }>();
    attendanceRecords.forEach((r) => {
      const sub = r.subjectId as any;
      const subId = sub?._id?.toString() || r.subjectId?.toString() || 'unknown';
      const subName = sub?.name || 'General Curriculum';
      const subCode = sub?.code || 'GEN';
      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subjectId: subId,
          name: subName,
          code: subCode,
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
        });
      }
      const item = subjectMap.get(subId)!;
      item.total += 1;
      if (r.status === 'PRESENT') item.present += 1;
      else if (r.status === 'ABSENT') item.absent += 1;
    });

    const bySubject = Array.from(subjectMap.values()).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 1000) / 10 : 0,
    }));

    if (totalAttendanceCount > 0) {
      calculatedAttendance = Math.round((presentAttendanceCount / totalAttendanceCount) * 1000) / 10;
      attendanceSubtext = `${presentAttendanceCount} of ${totalAttendanceCount} classes attended`;
      attendanceFormula = `${presentAttendanceCount} / ${totalAttendanceCount} × 100 = ${calculatedAttendance}%`;
    } else {
      // Fallback to legacy academic record if no granular attendance logged yet
      const legacyRecord = await AcademicRecord.findOne({ studentId: sId });
      if (legacyRecord && legacyRecord.attendance !== undefined) {
        calculatedAttendance = legacyRecord.attendance;
        attendanceSubtext = 'From academic profile record';
        attendanceFormula = `Stored baseline: ${calculatedAttendance}%`;
      }
    }

    // 2. PREVIOUS SCORE CALCULATION
    // Requirement 14: Comes from student's previous academic history (earlier semesters)
    let calculatedPreviousScore = 75;
    let previousScoreSubtext = 'No prior semester records';
    let previousScoreFormula = 'Standard entry baseline';
    let previousAcademicRecords: any[] = [];

    // Prior semester assessments
    const priorAssessments = await Assessment.find({
      studentId: sId,
      semester: { $lt: student.semester },
    }).lean();

    if (priorAssessments.length > 0) {
      const priorObtained = priorAssessments.reduce((sum, a) => sum + (a.obtainedMarks || 0), 0);
      const priorMax = priorAssessments.reduce((sum, a) => sum + (a.maximumMarks || 0), 0);
      if (priorMax > 0) {
        calculatedPreviousScore = Math.round((priorObtained / priorMax) * 1000) / 10;
        const priorSem = student.semester > 1 ? student.semester - 1 : 1;
        previousScoreSubtext = `From Semester 1 to ${priorSem} assessments`;
        previousScoreFormula = `${Math.round(priorObtained * 10) / 10} / ${priorMax} × 100 = ${calculatedPreviousScore}%`;
      }
    } else {
      // Search for prior semester academic records (semester < current semester)
      const priorRecords = await AcademicRecord.find({
        studentId: sId,
        semester: { $lt: student.semester },
      })
        .populate('subjectId', 'name code')
        .sort({ semester: -1 })
        .lean();

      if (priorRecords.length > 0) {
        previousAcademicRecords = priorRecords;
        const priorSem = priorRecords[0].semester;
        const semRecords = priorRecords.filter((r) => r.semester === priorSem);

        const totalScore = semRecords.reduce((sum, r) => {
          const val = r.finalScore != null ? r.finalScore : r.previousScore;
          return sum + (val || 0);
        }, 0);

        calculatedPreviousScore = Math.round((totalScore / semRecords.length) * 10) / 10;
        previousScoreSubtext = `From Semester ${priorSem}`;
        previousScoreFormula = `Average of Semester ${priorSem} records: ${calculatedPreviousScore} / 100`;
      } else {
        const anyRecord = await AcademicRecord.findOne({ studentId: sId });
        if (anyRecord && anyRecord.previousScore !== undefined) {
          calculatedPreviousScore = anyRecord.previousScore;
          const priorSem = student.semester > 1 ? student.semester - 1 : 1;
          previousScoreSubtext = `From Semester ${priorSem}`;
          previousScoreFormula = `Semester ${priorSem} baseline: ${calculatedPreviousScore} / 100`;
        }
      }
    }

    // 3. CURRENT ASSESSMENT MARKS CALCULATION
    // Requirement 4 & 9: Assessment Performance from current semester assessments
    const currentSemAssessments = await Assessment.find({
      studentId: sId,
      semester: student.semester,
    })
      .populate('subjectId', 'name code')
      .sort({ date: -1 })
      .lean();

    const allAssessments =
      currentSemAssessments.length > 0
        ? currentSemAssessments
        : await Assessment.find({ studentId: sId })
            .populate('subjectId', 'name code')
            .sort({ date: -1 })
            .lean();

    let calculatedInternalMarks = 0;
    let internalMarksSubtext = 'No assessments recorded';
    let internalMarksFormula = '0 / 0 × 100 = 0%';
    let totalObtainedMarks = 0;
    let totalMaximumMarks = 0;

    if (allAssessments.length > 0) {
      totalObtainedMarks = allAssessments.reduce((sum, a) => sum + (a.obtainedMarks || 0), 0);
      totalMaximumMarks = allAssessments.reduce((sum, a) => sum + (a.maximumMarks || 0), 0);

      if (totalMaximumMarks > 0) {
        calculatedInternalMarks = Math.round((totalObtainedMarks / totalMaximumMarks) * 1000) / 10;
        internalMarksSubtext = `Assessment Performance: ${Math.round(totalObtainedMarks * 10) / 10} of ${totalMaximumMarks} marks`;
        internalMarksFormula = `${Math.round(totalObtainedMarks * 10) / 10} / ${totalMaximumMarks} × 100 = ${calculatedInternalMarks}%`;
      }
    } else {
      const legacyRecord = await AcademicRecord.findOne({ studentId: sId });
      if (legacyRecord && legacyRecord.internalMarks !== undefined) {
        calculatedInternalMarks = legacyRecord.internalMarks;
        internalMarksSubtext = 'From academic profile record';
        internalMarksFormula = `Stored baseline: ${calculatedInternalMarks} / 100`;
      }
    }

    // 4. ASSIGNMENT CALCULATION
    // Requirement 12: Completed Assignments / Total Assignments × 100
    const submissions = await AssignmentSubmission.find({ studentId: sId })
      .populate('assignmentId')
      .sort({ createdAt: -1 })
      .lean();

    let calculatedAssignments = 0;
    let assignmentSubtext = 'No assignments tracked';
    let assignmentFormula = '0 / 0 × 100 = 0%';
    const totalAssignments = submissions.length;
    const completedAssignments = submissions.filter(
      (s) => s.status === 'SUBMITTED' || (s as any).status === 'GRADED'
    ).length;
    const notCompletedAssignments = totalAssignments - completedAssignments;

    if (totalAssignments > 0) {
      calculatedAssignments = Math.round((completedAssignments / totalAssignments) * 1000) / 10;
      assignmentSubtext = `${completedAssignments} of ${totalAssignments} completed`;
      assignmentFormula = `${completedAssignments} / ${totalAssignments} × 100 = ${calculatedAssignments}%`;
    } else {
      const legacyAssignments = await Assignment.find({ studentId: sId }).lean();
      if (legacyAssignments.length > 0) {
        const total = legacyAssignments.length;
        const comp = legacyAssignments.filter((a) => a.status === 'SUBMITTED' || a.status === 'GRADED').length;
        calculatedAssignments = Math.round((comp / total) * 1000) / 10;
        assignmentSubtext = `${comp} of ${total} completed`;
        assignmentFormula = `${comp} / ${total} × 100 = ${calculatedAssignments}%`;
      } else {
        const legacyRecord = await AcademicRecord.findOne({ studentId: sId });
        if (legacyRecord && legacyRecord.assignmentCompletion !== undefined) {
          calculatedAssignments = legacyRecord.assignmentCompletion;
          assignmentSubtext = 'From academic profile record';
          assignmentFormula = `Stored baseline: ${calculatedAssignments}%`;
        }
      }
    }

    // 5. STUDY HOURS CALCULATION
    const studyLogs = await StudyLog.find({ studentId: sId })
      .populate('subjectId', 'name code')
      .sort({ date: -1 })
      .lean();

    let calculatedStudyHours = 0;
    let studyHoursSubtext = 'No study hours logged';
    let studyHoursFormula = '0 hours logged';

    if (studyLogs.length > 0) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentLogs = studyLogs.filter((l) => new Date(l.date) >= oneWeekAgo);
      const effectiveLogs = recentLogs.length > 0 ? recentLogs : studyLogs.slice(0, 14);

      const totalHoursLogged = effectiveLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
      calculatedStudyHours = Math.round(totalHoursLogged * 10) / 10;
      studyHoursSubtext = 'Based on study logs';
      studyHoursFormula = `${effectiveLogs.map((l) => `${l.hours}h`).slice(0, 5).join(' + ')}${effectiveLogs.length > 5 ? ' + ...' : ''} = ${calculatedStudyHours} hrs/week`;
    } else {
      const legacyRecord = await AcademicRecord.findOne({ studentId: sId });
      if (legacyRecord && legacyRecord.studyHours !== undefined) {
        calculatedStudyHours = legacyRecord.studyHours;
        studyHoursSubtext = 'From academic profile record';
        studyHoursFormula = `Stored baseline: ${calculatedStudyHours} hrs/week`;
      }
    }

    // 6. PARTICIPATION CALCULATION
    const participationRecords = await ParticipationRecord.find({ studentId: sId })
      .populate('subjectId', 'name code')
      .sort({ date: -1 })
      .lean();

    let calculatedParticipation = 0;
    let participationSubtext = 'No participation recorded';
    let participationFormula = '0 / 0 × 100 = 0%';
    let partObtainedTotal = 0;
    let partMaxTotal = 0;

    if (participationRecords.length > 0) {
      partObtainedTotal = participationRecords.reduce((sum, p) => sum + (p.obtainedScore || 0), 0);
      partMaxTotal = participationRecords.reduce((sum, p) => sum + (p.maximumScore || 0), 0);

      if (partMaxTotal > 0) {
        calculatedParticipation = Math.round((partObtainedTotal / partMaxTotal) * 1000) / 10;
        participationSubtext = `Based on ${partObtainedTotal} of ${partMaxTotal} points`;
        participationFormula = `${partObtainedTotal} / ${partMaxTotal} × 100 = ${calculatedParticipation}%`;
      }
    } else {
      const legacyRecord = await AcademicRecord.findOne({ studentId: sId });
      if (legacyRecord && legacyRecord.participation !== undefined) {
        calculatedParticipation = legacyRecord.participation;
        participationSubtext = 'From academic profile record';
        participationFormula = `Stored baseline: ${calculatedParticipation}%`;
      }
    }

    // Compose feature inputs strictly for ANN
    const featureInputs: FeatureInputs = {
      attendance: Math.max(0, Math.min(100, calculatedAttendance)),
      previousScore: Math.max(0, Math.min(100, calculatedPreviousScore)),
      internalMarks: Math.max(0, Math.min(100, calculatedInternalMarks)),
      assignmentCompletion: Math.max(0, Math.min(100, calculatedAssignments)),
      studyHours: Math.max(0, Math.min(100, calculatedStudyHours)),
      participation: Math.max(0, Math.min(100, calculatedParticipation)),
    };

    return {
      attendance: {
        value: calculatedAttendance,
        formattedValue: `${calculatedAttendance}%`,
        subtext: attendanceSubtext,
        formula: attendanceFormula,
        source: 'Attendance Records',
        records: attendanceRecords as any,
        bySubject: bySubject as any,
        stats: {
          present: presentAttendanceCount,
          absent: absentAttendanceCount,
          total: totalAttendanceCount,
        },
      },
      previousScore: {
        value: calculatedPreviousScore,
        formattedValue: `${calculatedPreviousScore}%`,
        subtext: previousScoreSubtext,
        formula: previousScoreFormula,
        source: 'Previous Academic Record',
        records: previousAcademicRecords,
        stats: {
          score: calculatedPreviousScore,
        },
      },
      internalMarks: {
        value: calculatedInternalMarks,
        formattedValue: `${calculatedInternalMarks}%`,
        subtext: internalMarksSubtext,
        formula: internalMarksFormula,
        source: 'Assessment Records',
        records: allAssessments as any,
        stats: {
          obtained: totalObtainedMarks,
          maximum: totalMaximumMarks,
          count: allAssessments.length,
        },
      },
      assignmentCompletion: {
        value: calculatedAssignments,
        formattedValue: `${calculatedAssignments}%`,
        subtext: assignmentSubtext,
        formula: assignmentFormula,
        source: 'Assignment Submissions',
        records: submissions as any,
        stats: {
          completed: completedAssignments,
          notCompleted: notCompletedAssignments,
          total: totalAssignments,
        },
      },
      studyHours: {
        value: calculatedStudyHours,
        formattedValue: `${calculatedStudyHours} hrs/week`,
        subtext: studyHoursSubtext,
        formula: studyHoursFormula,
        source: 'Student Study Logs',
        records: studyLogs as any,
        stats: {
          weeklyHours: calculatedStudyHours,
          totalEntries: studyLogs.length,
        },
      },
      participation: {
        value: calculatedParticipation,
        formattedValue: `${calculatedParticipation}%`,
        subtext: participationSubtext,
        formula: participationFormula,
        source: 'Teacher Participation Records',
        records: participationRecords as any,
        stats: {
          obtained: partObtainedTotal,
          maximum: partMaxTotal,
          totalEntries: participationRecords.length,
        },
      },
      featureInputs,
    };
  }

  /**
   * Generates complete structured academic history for a student:
   * Program -> Year -> Semester -> Subject -> Standard Assessments (Mid 1, Mid 2, Internal Lab 1, Internal Lab 2, External Lab, Assignment)
   */
  async getFullAcademicHistory(studentId: string | mongoose.Types.ObjectId): Promise<StudentFullAcademicHistoryDTO> {
    const student = await Student.findById(studentId).lean();
    if (!student) {
      throw new Error(`Student not found with ID: ${studentId}`);
    }

    const programName = student.program || student.course || 'B.Tech';
    const programDoc = await Program.findOne({ name: programName }).lean();
    const durationYears = programDoc?.durationYears || (programName === 'B.Tech' ? 4 : 3);
    const totalSemesters = programDoc?.totalSemesters || durationYears * 2;

    // Find all subjects for student's department & program
    const departmentSubjects = await Subject.find({
      $or: [{ department: student.department }, { program: programName }],
    }).lean();

    // Fetch all student assessments
    const assessments = await Assessment.find({ studentId: student._id })
      .populate('subjectId', 'name code credits')
      .lean();

    // Group assessments by semester and subjectId
    const semSubAssessments = new Map<string, any[]>();
    for (const a of assessments) {
      const subId = (a.subjectId as any)?._id?.toString() || a.subjectId?.toString();
      if (!subId) continue;
      const key = `${a.semester}_${subId}`;
      if (!semSubAssessments.has(key)) {
        semSubAssessments.set(key, []);
      }
      semSubAssessments.get(key)!.push(a);
    }

    const yearLabels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
    const years: YearAcademicHistory[] = [];

    const standardTypes = [
      'Mid 1',
      'Mid 2',
      'Internal Lab 1',
      'Internal Lab 2',
      'External Lab',
      'Assignment',
    ];

    for (let y = 1; y <= durationYears; y++) {
      const sem1 = (y - 1) * 2 + 1;
      const sem2 = (y - 1) * 2 + 2;
      const semestersInYear = [sem1, sem2].filter((s) => s <= totalSemesters);

      const semesterHistories: SemesterAcademicHistory[] = [];

      for (const semNum of semestersInYear) {
        // Find subjects for this semester
        let semSubjects = departmentSubjects.filter((s) => s.semester === semNum);

        // Also include any subject where student already has an assessment in this semester
        for (const a of assessments) {
          if (a.semester === semNum && a.subjectId) {
            const aSub = a.subjectId as any;
            const aSubId = aSub._id?.toString() || aSub.toString();
            if (!semSubjects.some((s) => s._id.toString() === aSubId)) {
              semSubjects.push(aSub);
            }
          }
        }

        // If no subjects exist yet for this semester and student is in or past this semester, provide default curriculum subjects
        if (semSubjects.length === 0 && semNum <= student.semester) {
          semSubjects = [
            {
              _id: new mongoose.Types.ObjectId() as any,
              name: semNum === 1 ? 'Programming Fundamentals' : semNum === 2 ? 'Object Oriented Programming' : `Core Subject ${semNum}.1`,
              code: `CS${semNum}01`,
              credits: 4,
              program: programName,
              department: student.department,
              semester: semNum,
            } as any,
            {
              _id: new mongoose.Types.ObjectId() as any,
              name: semNum === 1 ? 'Engineering Mathematics I' : semNum === 2 ? 'Engineering Mathematics II' : `Core Subject ${semNum}.2`,
              code: `CS${semNum}02`,
              credits: 4,
              program: programName,
              department: student.department,
              semester: semNum,
            } as any,
          ];
        }

        const subjectHistories: SubjectAcademicHistory[] = [];
        let semTotalObtained = 0;
        let semTotalMaximum = 0;

        for (const sub of semSubjects) {
          const subId = sub._id.toString();
          const key = `${semNum}_${subId}`;
          const subAssessments = semSubAssessments.get(key) || [];

          const marksMap: Record<string, { obtainedMarks: number; maximumMarks: number }> = {};
          let subObtained = 0;
          let subMaximum = 0;

          for (const st of standardTypes) {
            const found = subAssessments.find((a) => {
              if (a.assessmentType === st) return true;
              if (st === 'Mid 1' && (a.assessmentType === 'Internal Assessment 1' || a.assessmentType === 'Mid Examination')) return true;
              if (st === 'Mid 2' && a.assessmentType === 'Internal Assessment 2') return true;
              return false;
            });

            if (found) {
              marksMap[st] = {
                obtainedMarks: found.obtainedMarks,
                maximumMarks: found.maximumMarks,
              };
              subObtained += found.obtainedMarks;
              subMaximum += found.maximumMarks;
            }
          }

          const assessmentPerformance = subMaximum > 0 ? Math.round((subObtained / subMaximum) * 1000) / 10 : 0;
          semTotalObtained += subObtained;
          semTotalMaximum += subMaximum;

          subjectHistories.push({
            subjectId: subId,
            name: sub.name,
            code: sub.code,
            credits: sub.credits,
            marks: marksMap,
            totalObtained: subObtained,
            totalMaximum: subMaximum,
            assessmentPerformance,
          });
        }

        const semPerformance = semTotalMaximum > 0 ? Math.round((semTotalObtained / semTotalMaximum) * 1000) / 10 : 0;

        semesterHistories.push({
          semester: semNum,
          year: y,
          subjects: subjectHistories,
          totalObtained: semTotalObtained,
          totalMaximum: semTotalMaximum,
          assessmentPerformance: semPerformance,
        });
      }

      years.push({
        year: y,
        yearLabel: yearLabels[y - 1] || `${y}th Year`,
        semesters: semesterHistories,
      });
    }

    return {
      program: programName,
      durationYears,
      totalSemesters,
      currentYear: student.year,
      currentSemester: student.semester,
      years,
    };
  }
}

export const studentMetricService = new StudentMetricService();
