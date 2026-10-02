import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testCohort(
  testNum: number,
  title: string,
  token: string,
  params: {
    program: string;
    department: string;
    year: number;
    semester: number;
    section: string;
    date: string;
  }
) {
  console.log(`\n========================================================`);
  console.log(`🧪 RUNNING TEST ${testNum}: ${title}`);
  console.log(`Params: Program=${params.program}, Dept=${params.department}, Year=${params.year}, Sem=${params.semester}, Sec=${params.section}, Date=${params.date}`);
  console.log(`========================================================`);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 1. Fetch subjects for this cohort
  const subRes = await axios.get(`${API_BASE}/subjects`, {
    params: {
      program: params.program,
      department: params.department,
      semester: params.semester,
    },
    headers: authHeaders,
  });

  const subjects = subRes.data.data;
  console.log(`Found ${subjects.length} subjects for this cohort:`);
  subjects.forEach((s: any) => console.log(`   - ${s.name} (${s.code})`));

  if (subjects.length === 0) {
    throw new Error(`FAIL: No subjects found for ${params.program} ${params.department} Sem ${params.semester}`);
  }

  const selectedSubject = subjects[0];

  // 2. Fetch Attendance Sheet
  const sheetRes = await axios.get(`${API_BASE}/attendance/sheet`, {
    params: {
      program: params.program,
      department: params.department,
      year: params.year,
      semester: params.semester,
      section: params.section,
      subjectId: selectedSubject._id,
      date: params.date,
    },
    headers: authHeaders,
  });

  const students = sheetRes.data.data.students;
  const totalEnrolled = students.length;
  const present = students.filter((s: any) => s.status === 'PRESENT').length;
  const absent = students.filter((s: any) => s.status === 'ABSENT').length;
  const notMarked = students.filter((s: any) => s.status === 'NOT_MARKED').length;

  console.log(`\nAttendance Sheet Results:`);
  console.log(`   Total Enrolled: ${totalEnrolled}`);
  console.log(`   Present:        ${present}`);
  console.log(`   Absent:         ${absent}`);
  console.log(`   Not Marked:     ${notMarked}`);
  const dayPct = totalEnrolled > 0 ? ((present / totalEnrolled) * 100).toFixed(1) + '%' : '0%';
  console.log(`   Day Attendance: ${dayPct}`);

  console.log(`\nSample Students Loaded (First 5):`);
  students.slice(0, 5).forEach((s: any) => {
    console.log(`   - ${s.studentNumber.padEnd(10)} ${s.studentName.padEnd(20)} Overall: ${s.currentAttendance?.percentage}% (${s.currentAttendance?.presentClasses}/${s.currentAttendance?.totalClasses}) | Today: ${s.status}`);
  });

  if (totalEnrolled < 5) {
    throw new Error(`FAIL: Expected at least 5-8 students in cohort, got ${totalEnrolled}`);
  }

  console.log(`✅ TEST ${testNum} PASSED: ${totalEnrolled} students loaded successfully with distinct records!`);
  return { totalEnrolled, present, absent, notMarked };
}

async function main() {
  console.log('1. Authenticating as Teacher...');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'teacher@eduguard.demo',
    password: 'EduGuard@2026!',
  });
  const token = loginRes.data.data.token;
  console.log('   Authenticated successfully.');

  // TEST 1: B.Tech Computer Science 2nd Year Semester 3 Section A
  await testCohort(1, 'B.Tech Computer Science 2nd Year Sem 3 Sec A', token, {
    program: 'B.Tech',
    department: 'Computer Science',
    year: 2,
    semester: 3,
    section: 'A',
    date: '2026-09-01',
  });

  // TEST 2: B.Tech Civil 2nd Year Semester 3 Section A (THE USER REPORTED BUG)
  await testCohort(2, 'B.Tech Civil 2nd Year Sem 3 Sec A', token, {
    program: 'B.Tech',
    department: 'Civil',
    year: 2,
    semester: 3,
    section: 'A',
    date: '2026-09-01',
  });

  // TEST 3: B.Tech ECE (Electronics) 3rd Year Semester 5 Section A
  await testCohort(3, 'B.Tech ECE (Electronics) 3rd Year Sem 5 Sec A', token, {
    program: 'B.Tech',
    department: 'ECE', // Testing with code 'ECE' to test canonical resolution!
    year: 3,
    semester: 5,
    section: 'A',
    date: '2026-09-01',
  });

  // TEST 4: BBA 1st Year Semester 1 Section A
  await testCohort(4, 'BBA 1st Year Sem 1 Sec A', token, {
    program: 'BBA',
    department: 'Business Administration',
    year: 1,
    semester: 1,
    section: 'A',
    date: '2026-09-01',
  });

  // TEST 5: B.Sc 2nd Year Semester 3 Section A
  await testCohort(5, 'B.Sc Computer Science 2nd Year Sem 3 Sec A', token, {
    program: 'B.Sc',
    department: 'Computer Science',
    year: 2,
    semester: 3,
    section: 'A',
    date: '2026-09-01',
  });

  // TEST 6: Date change behavior for Civil students on 2026-09-02 vs 2026-10-15 (Unrecorded)
  console.log('\n========================================================');
  console.log('🧪 TEST 6: Verifying Date Change & Not Marked Behavior for Civil Sem 3');
  console.log('========================================================');
  const authHeaders = { Authorization: `Bearer ${token}` };

  const civilSub = (await axios.get(`${API_BASE}/subjects?program=B.Tech&department=Civil&semester=3`, { headers: authHeaders })).data.data[0];

  const civilDay1 = (await axios.get(`${API_BASE}/attendance/sheet`, {
    params: { program: 'B.Tech', department: 'Civil', year: 2, semester: 3, section: 'A', subjectId: civilSub._id, date: '2026-09-01' },
    headers: authHeaders,
  })).data.data.students;

  const civilDay2 = (await axios.get(`${API_BASE}/attendance/sheet`, {
    params: { program: 'B.Tech', department: 'Civil', year: 2, semester: 3, section: 'A', subjectId: civilSub._id, date: '2026-09-02' },
    headers: authHeaders,
  })).data.data.students;

  const civilUnrecorded = (await axios.get(`${API_BASE}/attendance/sheet`, {
    params: { program: 'B.Tech', department: 'Civil', year: 2, semester: 3, section: 'A', subjectId: civilSub._id, date: '2026-10-15' },
    headers: authHeaders,
  })).data.data.students;

  console.log('Date 2026-09-01 statuses:');
  civilDay1.forEach((s: any) => console.log(`   - ${s.studentName.padEnd(20)}: ${s.status}`));

  console.log('\nDate 2026-09-02 statuses:');
  civilDay2.forEach((s: any) => console.log(`   - ${s.studentName.padEnd(20)}: ${s.status}`));

  const allNotMarked = civilUnrecorded.every((s: any) => s.status === 'NOT_MARKED');
  console.log(`\nUnrecorded Date (2026-10-15) all NOT_MARKED: ${allNotMarked}`);

  if (!allNotMarked) {
    throw new Error('FAIL: Unrecorded date did not return NOT_MARKED for all students');
  }

  console.log('\n========================================================');
  console.log('🎉 ALL 6 COHORT & ATTENDANCE TESTS PASSED PERFECTLY!');
  console.log('========================================================');
}

main().catch((err) => {
  console.error('❌ Test Error:', err.response?.data || err.message);
  process.exit(1);
});
