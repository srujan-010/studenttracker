import mongoose from 'mongoose';
import { env } from '../apps/api/src/config/environment';

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;

  const programs = await db.collection('programs').find().toArray();
  console.log('=== PROGRAMS ===');
  programs.forEach(p => console.log(`- ${p.name} (${p.code}), Duration: ${p.durationYears}y, Semesters: ${p.totalSemesters}, Departments: ${JSON.stringify(p.departments)}`));

  const departments = await db.collection('departments').find().toArray();
  console.log('\n=== DEPARTMENTS ===');
  departments.forEach(d => console.log(`- ${d.name} (${d.code}), Program: ${d.program}`));

  const subjects = await db.collection('subjects').find().toArray();
  console.log(`\n=== SUBJECTS (${subjects.length}) ===`);
  subjects.forEach(s => console.log(`- [${s.program}] [${s.department}] Sem ${s.semester}: ${s.name} (${s.code})`));

  const classes = await db.collection('classes').find().toArray();
  console.log(`\n=== CLASSES (${classes.length}) ===`);
  classes.forEach(c => console.log(`- [${c.program}] [${c.department}] Year ${c.year} Sem ${c.semester} Sec ${c.section}: ${c.name}`));

  await mongoose.disconnect();
}

run().catch(console.error);
