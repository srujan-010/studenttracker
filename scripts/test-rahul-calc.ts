import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDatabase, disconnectDatabase } from '../apps/api/src/config/database';
import { Student } from '../apps/api/src/models/Student';
import { studentMetricService } from '../apps/api/src/services/studentMetricService';

async function main() {
  await connectDatabase();
  const rahul = await Student.findOne({ studentId: 'STU2025001' });
  if (!rahul) {
    console.error('Rahul Sharma not found!');
    process.exit(1);
  }

  console.log(`Found student: ${rahul.name} (${rahul.studentId})`);
  const metrics = await studentMetricService.calculateStudentMetrics(rahul._id);
  console.log('Calculated Metrics:');
  console.log('  Attendance:', metrics.attendance.formattedValue, `(${metrics.attendance.subtext})`);
  console.log('  Previous Marks:', metrics.previousScore.formattedValue, `(${metrics.previousScore.subtext})`);
  console.log('  Internal Marks:', metrics.internalMarks.formattedValue, `(${metrics.internalMarks.subtext})`);
  console.log('  Assignments:', metrics.assignmentCompletion.formattedValue, `(${metrics.assignmentCompletion.subtext})`);
  console.log('  Study Hours:', metrics.studyHours.formattedValue, `(${metrics.studyHours.subtext})`);
  console.log('  Participation:', metrics.participation.formattedValue, `(${metrics.participation.subtext})`);
  console.log('FeatureInputs for ANN:');
  console.log(metrics.featureInputs);

  await disconnectDatabase();
}

main().catch(console.error);
