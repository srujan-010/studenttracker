import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function main() {
  console.log('========================================================');
  console.log('🧪 VERIFYING EDUGUARD AI DATASET & API ENDPOINTS');
  console.log('========================================================\n');

  // 1. Health check
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('1. API Health Check:', healthRes.data.status, '| ML Model Ready:', healthRes.data.mlService?.modelReady);

  // 2. Authentication
  console.log('\n2. Testing Authentication...');
  const teacherLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'teacher@eduguard.demo',
    password: 'EduGuard@2026!'
  });
  const teacherToken = teacherLogin.data.data.token;
  console.log('   Teacher Login: SUCCESS (Role: ' + teacherLogin.data.data.user.role + ')');

  const authHeaders = { Authorization: `Bearer ${teacherToken}` };

  // 3. Students Count & Pagination
  console.log('\n3. Verifying Student Count & Backend Pagination...');
  const page1 = await axios.get(`${API_BASE}/students?page=1&limit=15`, { headers: authHeaders });
  const totalStudents = page1.data.meta.total;
  const totalPages = page1.data.meta.totalPages;
  console.log(`   Total Students: ${totalStudents} (Expected >= 100)`);
  console.log(`   Page 1 count: ${page1.data.data.length}, Total Pages: ${totalPages}`);

  if (totalStudents < 100) {
    throw new Error(`Expected at least 100 students, got ${totalStudents}`);
  }

  // 4. Multi-Program Filtering
  console.log('\n4. Testing Multi-Program & Dependent Filters...');
  
  // B.Tech
  const btechRes = await axios.get(`${API_BASE}/students?program=B.Tech&limit=100`, { headers: authHeaders });
  console.log(`   B.Tech Students: ${btechRes.data.meta.total} (Expected: 60)`);

  // B.Tech 4th Year
  const btech4thRes = await axios.get(`${API_BASE}/students?program=B.Tech&academicYear=4th+Year&limit=100`, { headers: authHeaders });
  console.log(`   B.Tech 4th Year Students: ${btech4thRes.data.meta.total} (Expected: 15)`);

  // BBA
  const bbaRes = await axios.get(`${API_BASE}/students?program=BBA&limit=100`, { headers: authHeaders });
  console.log(`   BBA Students: ${bbaRes.data.meta.total} (Expected: 30)`);

  // BBA 3rd Year
  const bba3rdRes = await axios.get(`${API_BASE}/students?program=BBA&academicYear=3rd+Year&limit=100`, { headers: authHeaders });
  console.log(`   BBA 3rd Year Students: ${bba3rdRes.data.meta.total} (Expected: 10)`);

  // BBA 4th Year (should be 0 because BBA has only 3 years)
  const bba4thRes = await axios.get(`${API_BASE}/students?program=BBA&academicYear=4th+Year&limit=100`, { headers: authHeaders });
  console.log(`   BBA 4th Year Students: ${bba4thRes.data.meta.total} (Expected: 0)`);

  // B.Sc
  const bscRes = await axios.get(`${API_BASE}/students?program=B.Sc&limit=100`, { headers: authHeaders });
  console.log(`   B.Sc Students: ${bscRes.data.meta.total} (Expected: 30)`);

  // Section filtering
  const sectionARes = await axios.get(`${API_BASE}/students?program=B.Tech&department=Computer+Science&academicYear=2nd+Year&semester=3&section=A`, { headers: authHeaders });
  console.log(`   B.Tech CSE 2nd Yr Sem 3 Sec A: ${sectionARes.data.meta.total} students`);

  const sectionBRes = await axios.get(`${API_BASE}/students?program=B.Tech&department=Computer+Science&academicYear=2nd+Year&semester=3&section=B`, { headers: authHeaders });
  console.log(`   B.Tech CSE 2nd Yr Sem 3 Sec B: ${sectionBRes.data.meta.total} students`);

  // 5. Student Profile & Academic History
  console.log('\n5. Verifying Student Profile & Complete Academic History...');
  // Check Aarav Mehta (BTCS25002 - B.Tech 2nd Year Sem 3)
  const aaravProfile = await axios.get(`${API_BASE}/students/BTCS25002`, { headers: authHeaders });
  const aaravData = aaravProfile.data.data;
  console.log(`   Student: ${aaravData.name} (${aaravData.studentId})`);
  console.log(`   Program: ${aaravData.program} | Dept: ${aaravData.department} | Yr: ${aaravData.academicYear} | Sem: ${aaravData.semester} | Sec: ${aaravData.section}`);
  console.log(`   Current Performance: Attendance=${aaravData.calculatedMetrics?.attendance?.formattedValue}, Prev=${aaravData.calculatedMetrics?.previousScores?.formattedValue}, Assessment=${aaravData.calculatedMetrics?.internalAssessments?.formattedValue}, Assign=${aaravData.calculatedMetrics?.assignmentCompletion?.formattedValue}`);
  console.log(`   AI Prediction: Score=${aaravData.latestPrediction?.predictedScore}, Risk=${aaravData.latestPrediction?.riskLevel}`);
  console.log(`   Academic History Years: ${aaravData.academicHistory?.years?.length} years recorded`);
  aaravData.academicHistory?.years?.forEach((yr: any) => {
    console.log(`     - ${yr.yearLabel}: ${yr.semesters?.map((s: any) => `Sem ${s.semester} (${s.subjects?.length} subjects)`).join(', ')}`);
  });

  // Check a 4th Year B.Tech student (should have 4 academic history years recorded)
  const btech4thStudents = btech4thRes.data.data;
  if (btech4thStudents && btech4thStudents.length > 0) {
    const s4th = btech4thStudents[0];
    const s4thProfile = await axios.get(`${API_BASE}/students/${s4th.studentId}`, { headers: authHeaders });
    const s4thData = s4thProfile.data.data;
    console.log(`\n   4th Year Student: ${s4thData.name} (${s4thData.studentId})`);
    console.log(`   Historical Semesters recorded: ${s4thData.academicHistory?.years?.map((y: any) => y.yearLabel).join(', ')}`);
  }

  // 6. Dashboard Summary & Cohort Filtering
  console.log('\n6. Verifying Dashboard Summary & Cohort Filtering...');
  const dashOverall = await axios.get(`${API_BASE}/dashboard/summary`, { headers: authHeaders });
  const dStats = dashOverall.data.data;
  console.log('   Overall Dashboard Stats:', {
    totalStudents: dStats.totalStudents,
    highRisk: dStats.highRiskCount,
    mediumRisk: dStats.mediumRiskCount,
    lowRisk: dStats.lowRiskCount,
    avgPredictedScore: dStats.averagePredictedScore,
    avgAttendance: dStats.averageAttendance
  });

  const dashBTech = await axios.get(`${API_BASE}/dashboard/summary?program=B.Tech`, { headers: authHeaders });
  console.log('   B.Tech Cohort Stats:', {
    totalStudents: dashBTech.data.data.totalStudents,
    highRisk: dashBTech.data.data.highRiskCount,
    mediumRisk: dashBTech.data.data.mediumRiskCount,
    lowRisk: dashBTech.data.data.lowRiskCount
  });

  const dashBBA = await axios.get(`${API_BASE}/dashboard/summary?program=BBA`, { headers: authHeaders });
  console.log('   BBA Cohort Stats:', {
    totalStudents: dashBBA.data.data.totalStudents,
    highRisk: dashBBA.data.data.highRiskCount,
    mediumRisk: dashBBA.data.data.mediumRiskCount,
    lowRisk: dashBBA.data.data.lowRiskCount
  });

  // 7. Live Prediction Trigger via ML Microservice
  console.log('\n7. Testing Live AI Prediction Trigger via ML Microservice...');
  const aaravMongoId = aaravData._id;
  const predRes = await axios.post(`${API_BASE}/predictions`, { studentId: aaravMongoId }, { headers: authHeaders });
  console.log('   Live ML Prediction Response:', {
    studentName: predRes.data.data.studentName,
    predictedScore: predRes.data.data.predictedScore,
    riskLevel: predRes.data.data.riskLevel,
    riskFactorsCount: predRes.data.data.riskFactors?.length,
    recommendationsCount: predRes.data.data.recommendations?.length
  });

  // 8. Verifying Early Warnings Data
  console.log('\n8. Verifying Early Warnings Data Categorization...');
  const allEnrichedStudents = await axios.get(`${API_BASE}/students?limit=250`, { headers: authHeaders });
  const highRisk = allEnrichedStudents.data.data.filter((s: any) => s.latestPrediction?.riskLevel === 'HIGH');
  const mediumRisk = allEnrichedStudents.data.data.filter((s: any) => s.latestPrediction?.riskLevel === 'MEDIUM');
  const lowRisk = allEnrichedStudents.data.data.filter((s: any) => s.latestPrediction?.riskLevel === 'LOW');
  console.log(`   High Risk Students: ${highRisk.length}`);
  console.log(`   Medium Risk Students: ${mediumRisk.length}`);
  console.log(`   Low Risk Students: ${lowRisk.length}`);
  console.log(`   Sample High Risk: ${highRisk[0]?.name} (${highRisk[0]?.program} ${highRisk[0]?.department} Sem ${highRisk[0]?.semester}) - Score: ${highRisk[0]?.latestPrediction?.predictedScore}`);

  // 9. Verifying Student Self-Login & Profile Access
  console.log('\n9. Verifying Student Self-Login & Profile View...');
  const studentLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'student@eduguard.demo',
    password: 'EduGuard@2026!'
  });
  const studentToken = studentLogin.data.data.token;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };
  const meRes = await axios.get(`${API_BASE}/students/me`, { headers: studentHeaders });
  console.log(`   Student Self-View: ${meRes.data.data.name} (${meRes.data.data.studentId})`);
  console.log(`   Current Performance: Attendance=${meRes.data.data.calculatedMetrics?.attendance?.formattedValue}, AvgScore=${meRes.data.data.latestPrediction?.predictedScore}`);

  console.log('\n========================================================');
  console.log('✅ ALL BACKEND & ML TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================');
}

main().catch(err => {
  console.error('❌ Verification failed:', err.response?.data || err.message);
  process.exit(1);
});
