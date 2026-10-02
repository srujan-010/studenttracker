import mongoose from 'mongoose';
import axios from 'axios';
import { app } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Server } from 'http';

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function runTests() {
  console.log('========================================================');
  console.log(' Running EduGuard AI Comprehensive API Verification Test');
  console.log('========================================================');

  await connectDatabase();

  let server: Server;
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // TEST 1: Health check
    console.log('\n[1/10] Testing GET /api/health...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    if (healthRes.status === 200 && healthRes.data.status === 'HEALTHY') {
      console.log('  PASSED: API is healthy.');
    } else {
      throw new Error(`Health check failed: ${JSON.stringify(healthRes.data)}`);
    }

    // TEST 2: Admin Login
    console.log('\n[2/10] Testing Admin Login (admin@eduguard.demo)...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@eduguard.demo',
      password: 'EduGuard@2026!',
    });
    const adminToken = adminLoginRes.data.data.token;
    if (adminToken && adminLoginRes.data.data.user.role === 'ADMIN') {
      console.log('  PASSED: Admin authenticated with JWT token.');
    } else {
      throw new Error('Admin login failed.');
    }

    // TEST 3: Teacher Login
    console.log('\n[3/10] Testing Teacher Login (teacher@eduguard.demo)...');
    const teacherLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'teacher@eduguard.demo',
      password: 'EduGuard@2026!',
    });
    const teacherToken = teacherLoginRes.data.data.token;
    if (teacherToken && teacherLoginRes.data.data.user.role === 'TEACHER') {
      console.log('  PASSED: Teacher authenticated.');
    } else {
      throw new Error('Teacher login failed.');
    }

    // TEST 4: Student Login
    console.log('\n[4/10] Testing Student Login (student@eduguard.demo)...');
    const studentLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student@eduguard.demo',
      password: 'EduGuard@2026!',
    });
    const studentToken = studentLoginRes.data.data.token;
    if (studentToken && studentLoginRes.data.data.user.role === 'STUDENT') {
      console.log('  PASSED: Student authenticated.');
    } else {
      throw new Error('Student login failed.');
    }

    // TEST 5: Admin Dashboard Aggregated Metrics
    console.log('\n[5/10] Testing Admin GET /api/dashboard/summary (Real MongoDB Aggregations)...');
    const dashRes = await axios.get(`${BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const summary = dashRes.data.data;
    console.log(`  Metrics derived: Total Students=${summary.totalStudents}, High Risk=${summary.highRiskCount}, Med Risk=${summary.mediumRiskCount}, Low Risk=${summary.lowRiskCount}, Avg Score=${summary.averagePredictedScore}`);
    if (summary.totalStudents >= 30 && summary.riskDistribution.length === 3) {
      console.log('  PASSED: MongoDB Aggregation pipeline calculated valid live metrics.');
    } else {
      throw new Error('Dashboard summary metrics invalid.');
    }

    // TEST 6: Student List & Search
    console.log('\n[6/10] Testing GET /api/students with query parameters...');
    const studentsRes = await axios.get(`${BASE_URL}/students?search=Rahul`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (studentsRes.data.data.length > 0 && studentsRes.data.data[0].name.includes('Rahul')) {
      console.log(`  PASSED: Search query found student ${studentsRes.data.data[0].name}.`);
    } else {
      throw new Error('Student search failed.');
    }

    // TEST 7: Student Profile & History
    const testStudent = studentsRes.data.data[0];
    console.log(`\n[7/10] Testing GET /api/students/${testStudent._id}...`);
    const profileRes = await axios.get(`${BASE_URL}/students/${testStudent._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (profileRes.data.data.academicRecords && profileRes.data.data.latestPrediction) {
      console.log(`  PASSED: Profile loaded with academic records and latest prediction (Score: ${profileRes.data.data.latestPrediction.predictedScore}).`);
    } else {
      throw new Error('Student profile missing expected populated fields.');
    }

    // TEST 8: Role Authorization Enforcement
    console.log('\n[8/10] Testing Student RBAC restriction (cannot view another student)...');
    // Fetch a student other than the logged-in student
    const allStudentsRes = await axios.get(`${BASE_URL}/students?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const otherStudent = allStudentsRes.data.data.find(
      (s: any) => s.email !== 'student@eduguard.demo'
    );
    try {
      await axios.get(`${BASE_URL}/students/${otherStudent._id}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      throw new Error('FAIL: Student was able to access another student profile!');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log('  PASSED: 403 Forbidden properly returned when student attempted unauthorized access.');
      } else {
        throw err;
      }
    }

    // TEST 9: Interventions CRUD
    console.log('\n[9/10] Testing Intervention creation & status update...');
    const createInvRes = await axios.post(
      `${BASE_URL}/interventions`,
      {
        studentId: testStudent._id,
        type: 'STUDY_PLANNING',
        title: 'Weekly Study Time Management Plan',
        description: 'Establish structured 15 hrs/week study regimen before exams.',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      { headers: { Authorization: `Bearer ${teacherToken}` } }
    );
    const invId = createInvRes.data.data._id;
    const updateInvRes = await axios.put(
      `${BASE_URL}/interventions/${invId}`,
      { status: 'IN_PROGRESS', notes: 'First session completed with faculty mentor.' },
      { headers: { Authorization: `Bearer ${teacherToken}` } }
    );
    if (updateInvRes.data.data.status === 'IN_PROGRESS') {
      console.log('  PASSED: Intervention created and updated in MongoDB.');
    } else {
      throw new Error('Intervention update failed.');
    }

    // TEST 10: Audit Log Tracking
    console.log('\n[10/10] Testing Audit Logs retrieval for Admin...');
    const auditRes = await axios.get(`${BASE_URL}/audit-logs?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (auditRes.data.data.length > 0) {
      console.log(`  PASSED: Retrieved ${auditRes.data.data.length} audit log entries from MongoDB.`);
    } else {
      throw new Error('No audit logs found.');
    }

    console.log('\n========================================================');
    console.log(' ALL 10 API & DATABASE INTEGRATION TESTS PASSED (100%)');
    console.log('========================================================\n');
  } finally {
    server!.close();
    await disconnectDatabase();
  }
}

runTests().catch((err) => {
  console.error('\nAPI Tests Failed:', err);
  process.exit(1);
});
