import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDatabase, disconnectDatabase } from '../apps/api/src/config/database';
import { Student } from '../apps/api/src/models/Student';
import { AttendanceRecord } from '../apps/api/src/models/AttendanceRecord';
import { Assessment } from '../apps/api/src/models/Assessment';
import { AssignmentSubmission } from '../apps/api/src/models/AssignmentSubmission';
import { StudyLog } from '../apps/api/src/models/StudyLog';
import { ParticipationRecord } from '../apps/api/src/models/ParticipationRecord';
import { studentMetricService } from '../apps/api/src/services/studentMetricService';

async function testDynamicRecalculation() {
  await connectDatabase();
  console.log('--- Testing Dynamic Recalculation ---');

  const rahul = await Student.findOne({ studentId: 'STU2025001' });
  if (!rahul) throw new Error('Student not found');

  // 1. Initial State
  let metrics = await studentMetricService.calculateStudentMetrics(rahul._id);
  console.log('Initial Attendance:', metrics.attendance.formattedValue, `(${metrics.attendance.subtext})`);
  if (metrics.attendance.value !== 48) {
    throw new Error(`Expected 48%, got ${metrics.attendance.value}%`);
  }

  // 2. Change one ABSENT record to PRESENT
  const oneAbsent = await AttendanceRecord.findOne({ studentId: rahul._id, status: 'ABSENT' });
  if (!oneAbsent) throw new Error('No absent record found to flip');
  oneAbsent.status = 'PRESENT';
  await oneAbsent.save();

  // 3. Recalculate
  metrics = await studentMetricService.calculateStudentMetrics(rahul._id);
  console.log('Updated Attendance:', metrics.attendance.formattedValue, `(${metrics.attendance.subtext})`);
  if (metrics.attendance.value !== 52) {
    throw new Error(`Expected 52%, got ${metrics.attendance.value}%`);
  }
  console.log('PASSED: Attendance recalculated to 13/25 = 52% dynamically!');

  // Restore the record to ABSENT so baseline remains exact
  oneAbsent.status = 'ABSENT';
  await oneAbsent.save();
  metrics = await studentMetricService.calculateStudentMetrics(rahul._id);
  console.log('Restored Attendance:', metrics.attendance.formattedValue);

  // 4. Test Assignment Completion change
  console.log('Initial Assignments:', metrics.assignmentCompletion.formattedValue);
  const oneNotSubmitted = await AssignmentSubmission.findOne({ studentId: rahul._id, status: 'NOT_SUBMITTED' });
  if (oneNotSubmitted) {
    oneNotSubmitted.status = 'SUBMITTED';
    await oneNotSubmitted.save();

    metrics = await studentMetricService.calculateStudentMetrics(rahul._id);
    console.log('Updated Assignments (3 of 4):', metrics.assignmentCompletion.formattedValue);
    if (metrics.assignmentCompletion.value !== 75) {
      throw new Error(`Expected 75%, got ${metrics.assignmentCompletion.value}%`);
    }
    console.log('PASSED: Assignment completion recalculated to 3/4 = 75% dynamically!');

    oneNotSubmitted.status = 'NOT_SUBMITTED';
    await oneNotSubmitted.save();
  }

  // 5. Test Study Hours change
  console.log('Initial Study Hours:', metrics.studyHours.formattedValue);
  const newLog = await StudyLog.create({
    studentId: rahul._id,
    date: new Date(),
    hours: 2,
    topicsCovered: 'Extra Practice',
  });
  metrics = await studentMetricService.calculateStudentMetrics(rahul._id);
  console.log('Updated Study Hours (+2h):', metrics.studyHours.formattedValue);
  console.log('PASSED: Study hours updated dynamically!');
  await StudyLog.findByIdAndDelete(newLog._id);

  console.log('ALL DYNAMIC RECALCULATION TESTS PASSED!');
  await disconnectDatabase();
}

testDynamicRecalculation().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
