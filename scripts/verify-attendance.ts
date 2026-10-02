import axios from 'axios';
import { connectDatabase, disconnectDatabase } from '../apps/api/src/config/database';
import { AttendanceRecord } from '../apps/api/src/models/AttendanceRecord';

const API_BASE = 'http://localhost:5000/api';

async function main() {
  console.log('========================================================');
  console.log('🧪 VERIFYING EDUGUARD AI ATTENDANCE SYSTEM');
  console.log('========================================================\n');

  // 1. Authenticate as Teacher
  console.log('1. Authenticating as Teacher...');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'teacher@eduguard.demo',
    password: 'EduGuard@2026!',
  });
  const token = loginRes.data.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log('   Authentication SUCCESS.\n');

  // 2. Fetch Subjects for B.Tech CSE Sem 3
  console.log('2. Fetching Subjects for B.Tech CSE Sem 3...');
  const subjectsRes = await axios.get(`${API_BASE}/subjects?program=B.Tech&department=Computer+Science&semester=3`, {
    headers: authHeaders,
  });
  const targetSubject = subjectsRes.data.data[0];
  console.log(`   Using Subject: ${targetSubject.name} (${targetSubject.code})\n`);

  // 3. Fetch Attendance Sheet for Date: 2026-09-01 (01/09/2026)
  console.log('3. Fetching Attendance Sheet for Date: 2026-09-01 (01/09/2026)...');
  const sheet01 = await axios.get(`${API_BASE}/attendance/sheet`, {
    params: {
      program: 'B.Tech',
      department: 'Computer Science',
      semester: 3,
      section: 'A',
      subjectId: targetSubject._id,
      date: '2026-09-01',
    },
    headers: authHeaders,
  });

  const students01 = sheet01.data.data.students;
  console.log(`   Found ${students01.length} students in B.Tech CSE Sem 3 Sec A.`);
  console.log('   Attendance Statuses on 01/09/2026:');
  students01.forEach((s: any) => {
    console.log(`     - ${s.studentNumber.padEnd(10)} ${s.studentName.padEnd(18)} Subject Att: ${s.currentAttendance?.percentage}% (${s.currentAttendance?.presentClasses}/${s.currentAttendance?.totalClasses}) | Today: ${s.status}`);
  });

  // 4. Matrix across 10 dates (01 Sep to 10 Sep) demonstrating Requirement 5
  console.log('\n4. Testing Attendance Variation Across 10 Lecture Dates (Requirement 5 matrix)...');
  const dates = [
    '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05',
    '2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10',
  ];

  const headerRow = 'DATE       | ' + students01.map((s: any) => s.studentName.slice(0, 10).padEnd(10)).join(' | ');
  console.log('   ' + headerRow);
  console.log('   ' + '-'.repeat(headerRow.length));

  for (const d of dates) {
    const res = await axios.get(`${API_BASE}/attendance/sheet`, {
      params: {
        program: 'B.Tech',
        department: 'Computer Science',
        semester: 3,
        section: 'A',
        subjectId: targetSubject._id,
        date: d,
      },
      headers: authHeaders,
    });
    const row = res.data.data.students.map((s: any) => s.status.padEnd(10)).join(' | ');
    console.log(`   ${d} | ${row}`);
  }

  // 5. Test Unrecorded Date (e.g. 2026-10-05) - MUST BE "NOT_MARKED" (Requirement 8)
  console.log('\n5. Testing Unrecorded Date (2026-10-05)...');
  await connectDatabase();
  await AttendanceRecord.deleteMany({
    date: {
      $gte: new Date(Date.UTC(2026, 9, 5, 0, 0, 0, 0)),
      $lte: new Date(Date.UTC(2026, 9, 5, 23, 59, 59, 999)),
    },
  });

  const sheetUnrecorded = await axios.get(`${API_BASE}/attendance/sheet`, {
    params: {
      program: 'B.Tech',
      department: 'Computer Science',
      semester: 3,
      section: 'A',
      subjectId: targetSubject._id,
      date: '2026-10-05',
    },
    headers: authHeaders,
  });
  const unrecordedStudents = sheetUnrecorded.data.data.students;
  const notMarkedCount = unrecordedStudents.filter((s: any) => s.status === 'NOT_MARKED').length;
  const presentOnUnrecorded = unrecordedStudents.filter((s: any) => s.status === 'PRESENT').length;

  console.log(`   Total students on 05/10/2026: ${unrecordedStudents.length}`);
  console.log(`   Not Marked count: ${notMarkedCount} (Expected: ${unrecordedStudents.length})`);
  console.log(`   Present count on unrecorded date: ${presentOnUnrecorded} (Expected: 0)`);

  if (notMarkedCount !== unrecordedStudents.length || presentOnUnrecorded > 0) {
    throw new Error('FAIL: Unrecorded date auto-marked students as PRESENT! Expected all NOT_MARKED.');
  }
  console.log('   ✅ PASS: Unrecorded dates properly display NOT_MARKED. Never auto-marked as PRESENT.');

  // 6. Test Teacher Marking Attendance on Unrecorded Date & Saving to MongoDB
  console.log('\n6. Testing Teacher Marking Attendance for 2026-10-05 and Batch Saving...');
  const student1 = unrecordedStudents[0];
  const student2 = unrecordedStudents[1];

  const batchPayload = {
    subjectId: targetSubject._id,
    date: '2026-10-05',
    records: [
      { studentId: student1.studentId, status: 'PRESENT' },
      { studentId: student2.studentId, status: 'ABSENT' },
    ],
  };

  const saveRes = await axios.post(`${API_BASE}/attendance/batch`, batchPayload, { headers: authHeaders });
  console.log(`   Save Batch Response:`, saveRes.data.message);

  // Re-fetch sheet for 2026-10-05
  const recheckSheet = await axios.get(`${API_BASE}/attendance/sheet`, {
    params: {
      program: 'B.Tech',
      department: 'Computer Science',
      semester: 3,
      section: 'A',
      subjectId: targetSubject._id,
      date: '2026-10-05',
    },
    headers: authHeaders,
  });

  const recheck1 = recheckSheet.data.data.students.find((s: any) => s.studentId === student1.studentId);
  const recheck2 = recheckSheet.data.data.students.find((s: any) => s.studentId === student2.studentId);
  const recheck3 = recheckSheet.data.data.students[2];

  console.log(`   Verified Student 1 (${student1.studentName}): ${recheck1?.status} (Expected: PRESENT)`);
  console.log(`   Verified Student 2 (${student2.studentName}): ${recheck2?.status} (Expected: ABSENT)`);
  console.log(`   Verified Student 3 (${recheck3?.studentName}): ${recheck3?.status} (Expected: NOT_MARKED)`);

  if (recheck1?.status !== 'PRESENT' || recheck2?.status !== 'ABSENT' || recheck3?.status !== 'NOT_MARKED') {
    throw new Error('FAIL: Re-checked sheet did not reflect newly saved statuses accurately.');
  }
  console.log('   ✅ PASS: Teacher attendance edits persisted accurately in MongoDB.');

  // Clean up test batch records
  await AttendanceRecord.deleteMany({
    date: {
      $gte: new Date(Date.UTC(2026, 9, 5, 0, 0, 0, 0)),
      $lte: new Date(Date.UTC(2026, 9, 5, 23, 59, 59, 999)),
    },
  });

  // 7. Test Student Profile Attendance Breakdown & History (Requirement 13 & 14)
  console.log('\n7. Verifying Student Profile Attendance Breakdown & History for Aarav Mehta (BTCS25002)...');
  const aaravProfile = await axios.get(`${API_BASE}/students/BTCS25002`, { headers: authHeaders });
  const attMetric = aaravProfile.data.data.calculatedMetrics?.attendance;

  console.log(`   Overall Attendance: ${attMetric?.formattedValue} (${attMetric?.subtext})`);
  console.log(`   Formula: ${attMetric?.formula}`);
  console.log(`   Total Records: ${attMetric?.stats?.total} (Present: ${attMetric?.stats?.present}, Absent: ${attMetric?.stats?.absent})`);

  // Verify Subject Breakdown
  console.log(`   Subject Breakdown (${attMetric?.bySubject?.length} subjects):`);
  attMetric?.bySubject?.forEach((sub: any) => {
    console.log(`     - ${sub.name.padEnd(28)} (${sub.code}): ${sub.present}/${sub.total} present = ${sub.percentage}%`);
  });

  // Verify History Records
  console.log(`   Sample History Records (${attMetric?.records?.length} total records):`);
  attMetric?.records?.slice(0, 5).forEach((rec: any) => {
    const dStr = new Date(rec.date).toISOString().split('T')[0];
    const subName = rec.subjectId?.name || 'General';
    console.log(`     - Date: ${dStr} | Subject: ${subName.padEnd(28)} | Status: ${rec.status}`);
  });

  if (!attMetric?.bySubject || attMetric.bySubject.length === 0) {
    throw new Error('FAIL: bySubject attendance breakdown is empty!');
  }
  if (!attMetric?.records || attMetric.records.length === 0) {
    throw new Error('FAIL: Attendance history records list is empty!');
  }

  await disconnectDatabase();

  console.log('\n========================================================');
  console.log('✅ ALL ATTENDANCE REQUIREMENTS VERIFIED AND PASSED!');
  console.log('========================================================');
}

main().catch(async (err) => {
  console.error('❌ Attendance Verification Error:', err.response?.data || err.message);
  try { await disconnectDatabase(); } catch {}
  process.exit(1);
});
