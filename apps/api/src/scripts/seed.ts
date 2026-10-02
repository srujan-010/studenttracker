import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Subject } from '../models/Subject';
import { Class } from '../models/Class';
import { AcademicRecord } from '../models/AcademicRecord';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { Assessment } from '../models/Assessment';
import { Assignment } from '../models/Assignment';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { StudyLog } from '../models/StudyLog';
import { ParticipationRecord } from '../models/ParticipationRecord';
import { Prediction } from '../models/Prediction';
import { Intervention } from '../models/Intervention';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { SystemSettings } from '../models/SystemSettings';
import { ModelMetadata } from '../models/ModelMetadata';
import { Program } from '../models/Program';
import { Department } from '../models/Department';
import { DEFAULT_RISK_THRESHOLDS, RiskLevel } from '@eduguard/shared';
import { analyzeRiskFactors } from '../services/riskFactorService';
import { generateRecommendations } from '../services/recommendationService';

async function seed() {
  console.log('====================================================');
  console.log(' Starting EduGuard AI Database Seed (120+ STUDENTS)');
  console.log(' Multi-Program College Dataset (B.Tech, BBA, B.Sc)');
  console.log('====================================================');

  await connectDatabase();

  console.log('Clearing existing demo collections...');
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    Subject.deleteMany({}),
    Class.deleteMany({}),
    AcademicRecord.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    Assessment.deleteMany({}),
    Assignment.deleteMany({}),
    AssignmentSubmission.deleteMany({}),
    StudyLog.deleteMany({}),
    ParticipationRecord.deleteMany({}),
    Prediction.deleteMany({}),
    Intervention.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    SystemSettings.deleteMany({}),
    ModelMetadata.deleteMany({}),
    Program.deleteMany({}),
    Department.deleteMany({}),
  ]);

  try {
    await Class.collection.dropIndexes();
  } catch (e) {
    // ignore
  }

  const defaultPassword = 'EduGuard@2026!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Programs & Departments
  console.log('1. Seeding Programs & Departments...');
  await Program.insertMany([
    {
      name: 'B.Tech',
      code: 'BTECH',
      durationYears: 4,
      totalSemesters: 8,
      departments: ['Computer Science', 'Electronics', 'Electrical', 'Mechanical', 'Civil'],
    },
    {
      name: 'BBA',
      code: 'BBA',
      durationYears: 3,
      totalSemesters: 6,
      departments: ['Business Administration'],
    },
    {
      name: 'B.Sc',
      code: 'BSC',
      durationYears: 3,
      totalSemesters: 6,
      departments: ['Computer Science', 'Mathematics', 'Physics'],
    },
  ]);

  await Department.insertMany([
    { name: 'Computer Science', code: 'CSE', program: 'B.Tech' },
    { name: 'Electronics', code: 'ECE', program: 'B.Tech' },
    { name: 'Electrical', code: 'EEE', program: 'B.Tech' },
    { name: 'Mechanical', code: 'ME', program: 'B.Tech' },
    { name: 'Civil', code: 'CE', program: 'B.Tech' },
    { name: 'Business Administration', code: 'BBA', program: 'BBA' },
    { name: 'Computer Science', code: 'BSC-CS', program: 'B.Sc' },
    { name: 'Mathematics', code: 'BSC-MATH', program: 'B.Sc' },
    { name: 'Physics', code: 'BSC-PHYS', program: 'B.Sc' },
  ]);

  // 2. System Settings & Model Metadata
  console.log('2. Seeding System Settings...');
  await SystemSettings.create({
    institutionName: 'Apex Institute of Technology & Management',
    academicYear: '2025-2026',
    riskThresholds: DEFAULT_RISK_THRESHOLDS,
    activeModelVersion: 'v1.0.0',
  });

  await ModelMetadata.create({
    version: 'v1.0.0',
    features: [
      'attendance',
      'previousScore',
      'internalMarks',
      'assignmentCompletion',
      'studyHours',
      'participation',
    ],
    datasetIdentifier: 'COLLEGE_SYNTHETIC_V2',
    mae: 3.12,
    rmse: 4.45,
    r2: 0.914,
    frameworkVersion: 'TensorFlow 2.16 / Keras ANN',
    status: 'ACTIVE',
    hyperparameters: {
      layers: [64, 32, 16, 1],
      activation: 'relu',
      dropout: 0.2,
      optimizer: 'adam',
      learningRate: 0.001,
      epochs: 80,
    },
  });

  // 3. Admin & Teachers
  console.log('3. Seeding Admin and Teachers...');
  const adminUser = await User.create({
    name: 'Dr. Vikram Malhotra (Dean)',
    email: 'admin@eduguard.demo',
    passwordHash,
    role: 'ADMIN',
    institutionId: 'APEX-2026',
    status: 'ACTIVE',
  });

  const teacherUser1 = await User.create({
    name: 'Dr. Sunita Sharma',
    email: 'teacher@eduguard.demo',
    passwordHash,
    role: 'TEACHER',
    institutionId: 'APEX-2026',
    status: 'ACTIVE',
  });

  const teacherUser2 = await User.create({
    name: 'Prof. Rajesh Patel',
    email: 'prof.patel@eduguard.demo',
    passwordHash,
    role: 'TEACHER',
    institutionId: 'APEX-2026',
    status: 'ACTIVE',
  });

  // 4. Curricular Subjects
  console.log('4. Seeding Subjects across programs and semesters...');
  const subjectsData = [
    // B.Tech CSE
    { name: 'Engineering Mathematics I', code: 'CS101', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 1 },
    { name: 'Programming Fundamentals', code: 'CS102', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 1 },
    { name: 'Engineering Mathematics II', code: 'CS201', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 2 },
    { name: 'Object Oriented Programming', code: 'CS202', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 2 },
    { name: 'Data Structures & Algorithms', code: 'CS301', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 3 },
    { name: 'Database Management Systems', code: 'CS302', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 3 },
    { name: 'Operating Systems', code: 'CS303', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 3 },
    { name: 'Computer Networks', code: 'CS304', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 3 },
    { name: 'Java Programming', code: 'CS305', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 3 },
    { name: 'Design and Analysis of Algorithms', code: 'CS401', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 4 },
    { name: 'Software Engineering', code: 'CS402', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 4 },
    { name: 'Machine Learning Fundamentals', code: 'CS501', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 5 },
    { name: 'Web Technologies', code: 'CS502', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 5 },
    { name: 'Cloud Computing Architecture', code: 'CS601', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 6 },
    { name: 'Distributed Systems', code: 'CS701', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 7 },
    { name: 'Deep Learning & Neural Nets', code: 'CS702', credits: 4, program: 'B.Tech', department: 'Computer Science', semester: 7 },
    { name: 'Capstone Major Project', code: 'CS801', credits: 6, program: 'B.Tech', department: 'Computer Science', semester: 8 },

    // B.Tech Electronics
    { name: 'Basic Electrical & Electronics', code: 'EC101', credits: 4, program: 'B.Tech', department: 'Electronics', semester: 1 },
    { name: 'Electronic Devices & Circuits', code: 'EC201', credits: 4, program: 'B.Tech', department: 'Electronics', semester: 2 },
    { name: 'Digital Electronics & Logic', code: 'EC301', credits: 4, program: 'B.Tech', department: 'Electronics', semester: 3 },
    { name: 'Signals & Systems', code: 'EC302', credits: 4, program: 'B.Tech', department: 'Electronics', semester: 3 },
    { name: 'Analog Communication', code: 'EC401', credits: 4, program: 'B.Tech', department: 'Electronics', semester: 4 },
    { name: 'Microprocessors & Microcontrollers', code: 'EC501', credits: 4, program: 'B.Tech', department: 'Electronics', semester: 5 },
    { name: 'Digital Signal Processing', code: 'EC502', credits: 4, program: 'B.Tech', department: 'Electronics', semester: 5 },
    { name: 'VLSI Design & Embedded Systems', code: 'EC701', credits: 4, program: 'B.Tech', department: 'Electronics', semester: 7 },

    // B.Tech Electrical
    { name: 'Electric Circuit Analysis', code: 'EE101', credits: 4, program: 'B.Tech', department: 'Electrical', semester: 1 },
    { name: 'Electrical Machines I', code: 'EE301', credits: 4, program: 'B.Tech', department: 'Electrical', semester: 3 },
    { name: 'Control Systems Engineering', code: 'EE501', credits: 4, program: 'B.Tech', department: 'Electrical', semester: 5 },
    { name: 'Electric Drives & Renewable Energy', code: 'EE701', credits: 4, program: 'B.Tech', department: 'Electrical', semester: 7 },

    // B.Tech Mechanical
    { name: 'Engineering Mechanics', code: 'ME101', credits: 4, program: 'B.Tech', department: 'Mechanical', semester: 1 },
    { name: 'Thermodynamics & Heat Transfer', code: 'ME301', credits: 4, program: 'B.Tech', department: 'Mechanical', semester: 3 },
    { name: 'Machine Design & Kinematics', code: 'ME501', credits: 4, program: 'B.Tech', department: 'Mechanical', semester: 5 },
    { name: 'CAD/CAM & Automation', code: 'ME701', credits: 4, program: 'B.Tech', department: 'Mechanical', semester: 7 },

    // B.Tech Civil
    { name: 'Engineering Geology', code: 'CE101', credits: 4, program: 'B.Tech', department: 'Civil', semester: 1 },
    { name: 'Surveying & Building Materials', code: 'CE301', credits: 4, program: 'B.Tech', department: 'Civil', semester: 3 },
    { name: 'Fluid Mechanics', code: 'CE302', credits: 4, program: 'B.Tech', department: 'Civil', semester: 3 },
    { name: 'Mechanics of Solids', code: 'CE303', credits: 4, program: 'B.Tech', department: 'Civil', semester: 3 },
    { name: 'Structural Analysis & Design', code: 'CE501', credits: 4, program: 'B.Tech', department: 'Civil', semester: 5 },
    { name: 'Geotechnical Engineering', code: 'CE502', credits: 4, program: 'B.Tech', department: 'Civil', semester: 5 },
    { name: 'Environmental & Transportation Eng', code: 'CE701', credits: 4, program: 'B.Tech', department: 'Civil', semester: 7 },

    // BBA
    { name: 'Principles of Management', code: 'BBA101', credits: 3, program: 'BBA', department: 'Business Administration', semester: 1 },
    { name: 'Business Economics', code: 'BBA102', credits: 3, program: 'BBA', department: 'Business Administration', semester: 1 },
    { name: 'Financial Accounting & Reporting', code: 'BBA201', credits: 3, program: 'BBA', department: 'Business Administration', semester: 2 },
    { name: 'Marketing Management', code: 'BBA301', credits: 3, program: 'BBA', department: 'Business Administration', semester: 3 },
    { name: 'Human Resource Management', code: 'BBA302', credits: 3, program: 'BBA', department: 'Business Administration', semester: 3 },
    { name: 'Financial Management', code: 'BBA401', credits: 3, program: 'BBA', department: 'Business Administration', semester: 4 },
    { name: 'Strategic Management & Ethics', code: 'BBA501', credits: 3, program: 'BBA', department: 'Business Administration', semester: 5 },
    { name: 'Business Analytics & Decision Science', code: 'BBA502', credits: 3, program: 'BBA', department: 'Business Administration', semester: 5 },
    { name: 'International Business', code: 'BBA601', credits: 3, program: 'BBA', department: 'Business Administration', semester: 6 },

    // B.Sc Computer Science
    { name: 'Computer Fundamentals & C', code: 'BSC103', credits: 4, program: 'B.Sc', department: 'Computer Science', semester: 1 },
    { name: 'Data Structures in C++', code: 'BSC301', credits: 4, program: 'B.Sc', department: 'Computer Science', semester: 3 },
    { name: 'Operating Systems & Linux', code: 'BSC304', credits: 4, program: 'B.Sc', department: 'Computer Science', semester: 3 },
    { name: 'Advanced Algorithms & Computing', code: 'BSC503', credits: 4, program: 'B.Sc', department: 'Computer Science', semester: 5 },

    // B.Sc Mathematics
    { name: 'Calculus & Analytical Geometry', code: 'BSC101', credits: 4, program: 'B.Sc', department: 'Mathematics', semester: 1 },
    { name: 'Linear Algebra & Matrices', code: 'BSC201', credits: 4, program: 'B.Sc', department: 'Mathematics', semester: 2 },
    { name: 'Discrete Mathematical Structures', code: 'BSC302', credits: 4, program: 'B.Sc', department: 'Mathematics', semester: 3 },
    { name: 'Numerical Analysis', code: 'BSC401', credits: 4, program: 'B.Sc', department: 'Mathematics', semester: 4 },
    { name: 'Probability & Statistical Inference', code: 'BSC501', credits: 4, program: 'B.Sc', department: 'Mathematics', semester: 5 },
    { name: 'Mathematical Modeling & Project', code: 'BSC601', credits: 6, program: 'B.Sc', department: 'Mathematics', semester: 6 },

    // B.Sc Physics
    { name: 'Mechanics & Relativity', code: 'BSC102', credits: 4, program: 'B.Sc', department: 'Physics', semester: 1 },
    { name: 'Electricity & Magnetism', code: 'BSC202', credits: 4, program: 'B.Sc', department: 'Physics', semester: 2 },
    { name: 'Optics & Thermal Physics', code: 'BSC303', credits: 4, program: 'B.Sc', department: 'Physics', semester: 3 },
    { name: 'Quantum Mechanics & Modern Physics', code: 'BSC502', credits: 4, program: 'B.Sc', department: 'Physics', semester: 5 },
  ];

  const subjects = await Subject.insertMany(subjectsData);
  const subjectMap = new Map<string, any>();
  subjects.forEach((s) => {
    const key = `${s.program}|${s.department}|${s.semester}`;
    if (!subjectMap.has(key)) subjectMap.set(key, []);
    subjectMap.get(key).push(s);
  });

  // 5. Classes & Sections - Full College Coverage across all cohorts
  console.log('5. Seeding Academic Classes / Sections across all cohorts...');
  const classConfigs = [
    // B.Tech CSE
    { name: 'B.Tech CSE - 1st Year Sem 1 (Sec A)', program: 'B.Tech', department: 'Computer Science', year: 1, semester: 1, section: 'A' },
    { name: 'B.Tech CSE - 1st Year Sem 1 (Sec B)', program: 'B.Tech', department: 'Computer Science', year: 1, semester: 1, section: 'B' },
    { name: 'B.Tech CSE - 2nd Year Sem 3 (Sec A)', program: 'B.Tech', department: 'Computer Science', year: 2, semester: 3, section: 'A' },
    { name: 'B.Tech CSE - 2nd Year Sem 3 (Sec B)', program: 'B.Tech', department: 'Computer Science', year: 2, semester: 3, section: 'B' },
    { name: 'B.Tech CSE - 3rd Year Sem 5 (Sec A)', program: 'B.Tech', department: 'Computer Science', year: 3, semester: 5, section: 'A' },
    { name: 'B.Tech CSE - 3rd Year Sem 5 (Sec B)', program: 'B.Tech', department: 'Computer Science', year: 3, semester: 5, section: 'B' },
    { name: 'B.Tech CSE - 4th Year Sem 7 (Sec A)', program: 'B.Tech', department: 'Computer Science', year: 4, semester: 7, section: 'A' },
    { name: 'B.Tech CSE - 4th Year Sem 7 (Sec B)', program: 'B.Tech', department: 'Computer Science', year: 4, semester: 7, section: 'B' },

    // B.Tech Civil (Includes 2nd Year Sem 3 - Requirement 18 & 20)
    { name: 'B.Tech CE - 1st Year Sem 1 (Sec A)', program: 'B.Tech', department: 'Civil', year: 1, semester: 1, section: 'A' },
    { name: 'B.Tech CE - 1st Year Sem 1 (Sec B)', program: 'B.Tech', department: 'Civil', year: 1, semester: 1, section: 'B' },
    { name: 'B.Tech CE - 2nd Year Sem 3 (Sec A)', program: 'B.Tech', department: 'Civil', year: 2, semester: 3, section: 'A' },
    { name: 'B.Tech CE - 2nd Year Sem 3 (Sec B)', program: 'B.Tech', department: 'Civil', year: 2, semester: 3, section: 'B' },
    { name: 'B.Tech CE - 3rd Year Sem 5 (Sec A)', program: 'B.Tech', department: 'Civil', year: 3, semester: 5, section: 'A' },
    { name: 'B.Tech CE - 3rd Year Sem 5 (Sec B)', program: 'B.Tech', department: 'Civil', year: 3, semester: 5, section: 'B' },
    { name: 'B.Tech CE - 4th Year Sem 7 (Sec A)', program: 'B.Tech', department: 'Civil', year: 4, semester: 7, section: 'A' },
    { name: 'B.Tech CE - 4th Year Sem 7 (Sec B)', program: 'B.Tech', department: 'Civil', year: 4, semester: 7, section: 'B' },

    // B.Tech Electronics / ECE (Includes 3rd Year Sem 5 - Requirement 18)
    { name: 'B.Tech ECE - 1st Year Sem 1 (Sec A)', program: 'B.Tech', department: 'Electronics', year: 1, semester: 1, section: 'A' },
    { name: 'B.Tech ECE - 1st Year Sem 1 (Sec B)', program: 'B.Tech', department: 'Electronics', year: 1, semester: 1, section: 'B' },
    { name: 'B.Tech ECE - 2nd Year Sem 3 (Sec A)', program: 'B.Tech', department: 'Electronics', year: 2, semester: 3, section: 'A' },
    { name: 'B.Tech ECE - 2nd Year Sem 3 (Sec B)', program: 'B.Tech', department: 'Electronics', year: 2, semester: 3, section: 'B' },
    { name: 'B.Tech ECE - 3rd Year Sem 5 (Sec A)', program: 'B.Tech', department: 'Electronics', year: 3, semester: 5, section: 'A' },
    { name: 'B.Tech ECE - 3rd Year Sem 5 (Sec B)', program: 'B.Tech', department: 'Electronics', year: 3, semester: 5, section: 'B' },
    { name: 'B.Tech ECE - 4th Year Sem 7 (Sec A)', program: 'B.Tech', department: 'Electronics', year: 4, semester: 7, section: 'A' },
    { name: 'B.Tech ECE - 4th Year Sem 7 (Sec B)', program: 'B.Tech', department: 'Electronics', year: 4, semester: 7, section: 'B' },

    // B.Tech Mechanical
    { name: 'B.Tech ME - 1st Year Sem 1 (Sec A)', program: 'B.Tech', department: 'Mechanical', year: 1, semester: 1, section: 'A' },
    { name: 'B.Tech ME - 2nd Year Sem 3 (Sec A)', program: 'B.Tech', department: 'Mechanical', year: 2, semester: 3, section: 'A' },
    { name: 'B.Tech ME - 2nd Year Sem 3 (Sec B)', program: 'B.Tech', department: 'Mechanical', year: 2, semester: 3, section: 'B' },
    { name: 'B.Tech ME - 3rd Year Sem 5 (Sec A)', program: 'B.Tech', department: 'Mechanical', year: 3, semester: 5, section: 'A' },
    { name: 'B.Tech ME - 4th Year Sem 7 (Sec A)', program: 'B.Tech', department: 'Mechanical', year: 4, semester: 7, section: 'A' },
    { name: 'B.Tech ME - 4th Year Sem 7 (Sec B)', program: 'B.Tech', department: 'Mechanical', year: 4, semester: 7, section: 'B' },

    // B.Tech Electrical
    { name: 'B.Tech EEE - 1st Year Sem 1 (Sec A)', program: 'B.Tech', department: 'Electrical', year: 1, semester: 1, section: 'A' },
    { name: 'B.Tech EEE - 2nd Year Sem 3 (Sec A)', program: 'B.Tech', department: 'Electrical', year: 2, semester: 3, section: 'A' },
    { name: 'B.Tech EEE - 3rd Year Sem 5 (Sec A)', program: 'B.Tech', department: 'Electrical', year: 3, semester: 5, section: 'A' },
    { name: 'B.Tech EEE - 4th Year Sem 7 (Sec A)', program: 'B.Tech', department: 'Electrical', year: 4, semester: 7, section: 'A' },
    { name: 'B.Tech EEE - 4th Year Sem 7 (Sec B)', program: 'B.Tech', department: 'Electrical', year: 4, semester: 7, section: 'B' },

    // BBA (Includes 1st Year Sem 1 - Requirement 18)
    { name: 'BBA - 1st Year Sem 1 (Sec A)', program: 'BBA', department: 'Business Administration', year: 1, semester: 1, section: 'A' },
    { name: 'BBA - 1st Year Sem 1 (Sec B)', program: 'BBA', department: 'Business Administration', year: 1, semester: 1, section: 'B' },
    { name: 'BBA - 2nd Year Sem 3 (Sec A)', program: 'BBA', department: 'Business Administration', year: 2, semester: 3, section: 'A' },
    { name: 'BBA - 2nd Year Sem 3 (Sec B)', program: 'BBA', department: 'Business Administration', year: 2, semester: 3, section: 'B' },
    { name: 'BBA - 3rd Year Sem 5 (Sec A)', program: 'BBA', department: 'Business Administration', year: 3, semester: 5, section: 'A' },
    { name: 'BBA - 3rd Year Sem 5 (Sec B)', program: 'BBA', department: 'Business Administration', year: 3, semester: 5, section: 'B' },

    // B.Sc Computer Science (Includes 2nd Year Sem 3 - Requirement 18)
    { name: 'B.Sc CS - 1st Year Sem 1 (Sec A)', program: 'B.Sc', department: 'Computer Science', year: 1, semester: 1, section: 'A' },
    { name: 'B.Sc CS - 1st Year Sem 1 (Sec B)', program: 'B.Sc', department: 'Computer Science', year: 1, semester: 1, section: 'B' },
    { name: 'B.Sc CS - 2nd Year Sem 3 (Sec A)', program: 'B.Sc', department: 'Computer Science', year: 2, semester: 3, section: 'A' },
    { name: 'B.Sc CS - 2nd Year Sem 3 (Sec B)', program: 'B.Sc', department: 'Computer Science', year: 2, semester: 3, section: 'B' },
    { name: 'B.Sc CS - 3rd Year Sem 5 (Sec A)', program: 'B.Sc', department: 'Computer Science', year: 3, semester: 5, section: 'A' },
    { name: 'B.Sc CS - 3rd Year Sem 5 (Sec B)', program: 'B.Sc', department: 'Computer Science', year: 3, semester: 5, section: 'B' },

    // B.Sc Mathematics
    { name: 'B.Sc Math - 1st Year Sem 1 (Sec A)', program: 'B.Sc', department: 'Mathematics', year: 1, semester: 1, section: 'A' },
    { name: 'B.Sc Math - 1st Year Sem 1 (Sec B)', program: 'B.Sc', department: 'Mathematics', year: 1, semester: 1, section: 'B' },
    { name: 'B.Sc Math - 2nd Year Sem 3 (Sec A)', program: 'B.Sc', department: 'Mathematics', year: 2, semester: 3, section: 'A' },
    { name: 'B.Sc Math - 3rd Year Sem 5 (Sec B)', program: 'B.Sc', department: 'Mathematics', year: 3, semester: 5, section: 'B' },

    // B.Sc Physics
    { name: 'B.Sc Physics - 1st Year Sem 1 (Sec A)', program: 'B.Sc', department: 'Physics', year: 1, semester: 1, section: 'A' },
    { name: 'B.Sc Physics - 2nd Year Sem 3 (Sec A)', program: 'B.Sc', department: 'Physics', year: 2, semester: 3, section: 'A' },
    { name: 'B.Sc Physics - 2nd Year Sem 3 (Sec B)', program: 'B.Sc', department: 'Physics', year: 2, semester: 3, section: 'B' },
  ];

  const createdClasses = await Class.insertMany(
    classConfigs.map((c) => ({
      ...c,
      academicYear: '2025-2026',
      teacherIds: [teacherUser1._id, teacherUser2._id],
      subjectIds: [],
    }))
  );

  const allClassesIds = createdClasses.map((c) => c._id);

  // Link Teachers to all classes
  const teacher1 = await Teacher.create({
    userId: teacherUser1._id,
    employeeId: 'EMP-FACULTY-101',
    department: 'Computer Science',
    assignedSubjects: subjects.map((s) => s._id),
    assignedClasses: allClassesIds,
  });

  const teacher2 = await Teacher.create({
    userId: teacherUser2._id,
    employeeId: 'EMP-FACULTY-102',
    department: 'Business Administration',
    assignedSubjects: subjects.map((s) => s._id),
    assignedClasses: allClassesIds,
  });

  // 6. Seed Realistic Students for Every Cohort (Requirement 5, 6 & 18)
  console.log('6. Generating authentic synthetic student profiles for all cohorts...');

  const studentPool = [
    // B.Tech CSE 2nd Year Sem 3 (Aarav Mehta & cohort)
    'Aarav Mehta', 'Priya Nair', 'Sneha Reddy', 'Arjun Patel', 'Neha Gupta',
    'Rohit Verma', 'Kavya Singh', 'Manish Agarwal', 'Shreya Kulkarni', 'Nikhil Nair',
    'Deepika Menon', 'Rohan Chopra',
    // B.Tech Civil 2nd Year Sem 3 (Requirement 20)
    'Aarav Kumar', 'Rahul Sharma', 'Priya Singh', 'Neha Patel', 'Kiran Rao',
    'Ananya Reddy', 'Rohit Kumar', 'Sneha Rao', 'Vikram Desai', 'Pooja Joshi',
    'Siddharth Jain', 'Divya Pillai',
    // B.Tech ECE 3rd Year Sem 5 (TEST 3)
    'Aditya Saxena', 'Tanvi Deshmukh', 'Harsh Vardhan', 'Kunal Kapoor', 'Meera Nambiar',
    'Varun Bhatia', 'Ishaan Trivedi', 'Swati Tiwari', 'Riya Sen', 'Alok Srivastava',
    'Pallavi Hegde', 'Ayush Bhatt',
    // BBA 1st Year Sem 1 (TEST 4)
    'Charu Mathur', 'Chetan Vyas', 'Archana Dixit', 'Dinesh Lodha', 'Garima Ahuja',
    'Hemant Negi', 'Jaya Madhavan', 'Lokesh Soni', 'Madhuri Kamath', 'Naveen Balan',
    'Parul Chawla', 'Rakesh Tyagi',
    // B.Sc CS 2nd Year Sem 3 (TEST 5)
    'Padmini Murthy', 'Qasim Rizvi', 'Radhika Apte', 'Sahil Vohra', 'Trisha Krishnan',
    'Utkarsh Gupta', 'Vidya Subramaniam', 'Wasim Akram', 'Yogesh Bhardwaj', 'Zara Sheikh',
    'Farhan Qureshi', 'Gauri Shinde',
    // B.Tech CSE 1st Year Sem 1
    'Prateek Mishra', 'Sanya Bansal', 'Tarun Narang', 'Ritika Rawat', 'Gaurav Pandey',
    'Simran Gill', 'Shruti Mukherjee', 'Mayank Jain', 'Lavanya Sundaram', 'Kartik Grover',
    'Namrata Shah', 'Tushar Sengupta',
    // B.Tech CSE 3rd Year Sem 5
    'Shalini Yadav', 'Vivek Mehra', 'Bhavna Chauhan', 'Abhay Singhal', 'Richa Kashyap',
    'Deepak Mittal', 'Barkha Roy', 'Mohit Somani', 'Preeti Goel', 'Nitesh Anand',
    'Shilpa Thapar', 'Rajiv Kaul',
    // B.Tech CSE 4th Year Sem 7
    'Payal Sethi', 'Saurabh Dewan', 'Yashwant Rao', 'Aniket Ghosh', 'Devika Warrier',
    'Eeshan Paranjpe', 'Hitesh Doshi', 'Indira Varma', 'Jatin Khatri', 'Koushik Roy',
    'Lalita Mudaliar', 'Mahesh Tendulkar',
    // B.Tech Civil 1st Year Sem 1
    'Nandita Dasgupta', 'Omkar Salunkhe', 'Ashwin Ramachandran', 'Brijesh Solanki', 'Chitra Vishwanathan',
    'Dhiren Morakhia', 'Ekta Kapoor', 'Govind Menon', 'Harini Natarajan', 'Indrajit Sen',
    'Jyotsna Kadam', 'Kailash Kher',
    // B.Tech Civil 3rd Year Sem 5
    'Rashmi Bhalla', 'Sachin Gokhale', 'Sakshi Oberoi', 'Sandeep Nayak', 'Seema Dutta',
    'Subhash Chandra', 'Sunidhi Chauhan', 'Tejaswini Shenoy', 'Uday Shankar', 'Vandana Prabhu',
    'Vikas Chadha', 'Vinay Nadkarni',
    // B.Tech Civil 4th Year Sem 7
    'Yamini Rao', 'Zubin Engineer', 'Amol Palekar', 'Bipasha Basu', 'Cyrus Broacha',
    'Dia Mirza', 'Emraan Hashmi', 'Fatima Sana', 'Gulshan Grover', 'Huma Qureshi',
    'Irrfan Khan', 'Juhi Chawla',
    // B.Tech ECE 1st Year Sem 1
    'Kay Kay Menon', 'Lara Dutta', 'Manoj Bajpayee', 'Naseeruddin Shah', 'Om Puri',
    'Pankaj Tripathi', 'Radhika Madan', 'Randeep Hooda', 'Sanjay Mishra', 'Tabu Hashmi',
    'Urmila Matondkar', 'Vijay Raaz',
    // B.Tech ECE 2nd Year Sem 3
    'Anupam Kher', 'Boman Irani', 'Chunky Pandey', 'Danny Denzongpa', 'Esha Deol',
    'Farida Jalal', 'Govinda Ahuja', 'Helen Richardson', 'Ila Arun', 'Jaaved Jaaferi',
    'Kulbhushan Kharbanda', 'Lucky Ali',
    // B.Tech ECE 4th Year Sem 7
    'Mallika Sherawat', 'Nana Patekar', 'Paresh Rawal', 'Rajpal Yadav', 'Satish Kaushik',
    'Tiku Talsania', 'Upendra Limaye', 'Varun Sharma', 'Zayed Khan', 'Ayesha Takia',
    'Bobby Deol', 'Celina Jaitly',
    // B.Tech Mechanical 2nd Year Sem 3
    'Dharmendra Deol', 'Feroz Khan', 'Girish Karnad', 'Harish Patel', 'Inder Kumar',
    'Jeetendra Kapoor', 'Kamal Haasan', 'Mithun Chakraborty', 'Prem Chopra', 'Pran Sikand',
    'Rishi Kapoor', 'Shashi Kapoor',
    // B.Tech Mechanical 4th Year Sem 7
    'Sunil Dutt', 'Vinod Khanna', 'Amrish Puri', 'Ashok Kumar', 'Dev Anand',
    'Dilip Kumar', 'Guru Dutt', 'Kishore Kumar', 'Raj Kapoor', 'Sanjeev Kumar',
    'Shammi Kapoor', 'Uttam Kumar',
    // B.Tech Electrical 2nd Year Sem 3 & 4th Year Sem 7
    'Abhishek Bachchan', 'Akshay Kumar', 'Ajay Devgn', 'Aamir Khan', 'Shah Rukh Khan',
    'Salman Khan', 'Saif Ali Khan', 'Hrithik Roshan', 'Ranbir Kapoor', 'Ranveer Singh',
    'Shahid Kapoor', 'Ayushmann Khurrana',
    // BBA 2nd Year Sem 3 & 3rd Year Sem 5
    'Kartik Aaryan', 'Vicky Kaushal', 'Sidharth Malhotra', 'Varun Dhawan', 'Tiger Shroff',
    'Rajkummar Rao', 'Dulquer Salmaan', 'Fahadh Faasil', 'Nani Bellamkonda', 'Vijay Deverakonda',
    'Allu Arjun', 'Ram Charan', 'Jr NTR', 'Prabhas Raju', 'Yash Gowda', 'Rishab Shetty',
    // B.Sc Math & Physics cohorts
    'Kareena Kapoor', 'Katrina Kaif', 'Deepika Padukone', 'Priyanka Chopra', 'Anushka Sharma',
    'Alia Bhatt', 'Shraddha Kapoor', 'Kriti Sanon', 'Kiara Advani', 'Disha Patani',
    'Jacqueline Fernandez', 'Taapsee Pannu', 'Bhumi Pednekar', 'Yami Gautam', 'Nushrratt Bharuccha'
  ];

  interface StudentPlan {
    name: string;
    studentId: string;
    email: string;
    program: string;
    department: string;
    year: number;
    semester: number;
    section: string;
    riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
    isDemoStudentUser?: boolean;
  }

  const studentPlans: StudentPlan[] = [];
  let namePoolIdx = 0;

  // Cohort specifications with guaranteed 8 students in Section A for every key cohort
  interface CohortSpec {
    program: string;
    department: string;
    year: number;
    semester: number;
    idPrefix: string;
    secACount: number;
    secBCount: number;
    hasDemoUser?: boolean;
  }

  const cohortSpecs: CohortSpec[] = [
    // 1. TEST 1: B.Tech Computer Science 2nd Year Sem 3
    { program: 'B.Tech', department: 'Computer Science', year: 2, semester: 3, idPrefix: 'BTCS2', secACount: 8, secBCount: 4, hasDemoUser: true },
    // 2. TEST 2: B.Tech Civil 2nd Year Sem 3
    { program: 'B.Tech', department: 'Civil', year: 2, semester: 3, idPrefix: 'BTCE2', secACount: 8, secBCount: 4 },
    // 3. TEST 3: B.Tech Electronics 3rd Year Sem 5 (ECE)
    { program: 'B.Tech', department: 'Electronics', year: 3, semester: 5, idPrefix: 'BTEC3', secACount: 8, secBCount: 4 },
    // 4. TEST 4: BBA 1st Year Sem 1
    { program: 'BBA', department: 'Business Administration', year: 1, semester: 1, idPrefix: 'BBA1', secACount: 8, secBCount: 4 },
    // 5. TEST 5: B.Sc Computer Science 2nd Year Sem 3
    { program: 'B.Sc', department: 'Computer Science', year: 2, semester: 3, idPrefix: 'BSCS2', secACount: 8, secBCount: 4 },

    // Additional cohorts across the institution
    { program: 'B.Tech', department: 'Computer Science', year: 1, semester: 1, idPrefix: 'BTCS1', secACount: 8, secBCount: 4 },
    { program: 'B.Tech', department: 'Computer Science', year: 3, semester: 5, idPrefix: 'BTCS3', secACount: 8, secBCount: 4 },
    { program: 'B.Tech', department: 'Computer Science', year: 4, semester: 7, idPrefix: 'BTCS4', secACount: 8, secBCount: 4 },

    { program: 'B.Tech', department: 'Civil', year: 1, semester: 1, idPrefix: 'BTCE1', secACount: 8, secBCount: 4 },
    { program: 'B.Tech', department: 'Civil', year: 3, semester: 5, idPrefix: 'BTCE3', secACount: 8, secBCount: 4 },
    { program: 'B.Tech', department: 'Civil', year: 4, semester: 7, idPrefix: 'BTCE4', secACount: 8, secBCount: 4 },

    { program: 'B.Tech', department: 'Electronics', year: 1, semester: 1, idPrefix: 'BTEC1', secACount: 8, secBCount: 4 },
    { program: 'B.Tech', department: 'Electronics', year: 2, semester: 3, idPrefix: 'BTEC2', secACount: 8, secBCount: 4 },
    { program: 'B.Tech', department: 'Electronics', year: 4, semester: 7, idPrefix: 'BTEC4', secACount: 8, secBCount: 4 },

    { program: 'B.Tech', department: 'Mechanical', year: 2, semester: 3, idPrefix: 'BTME2', secACount: 8, secBCount: 4 },
    { program: 'B.Tech', department: 'Mechanical', year: 4, semester: 7, idPrefix: 'BTME4', secACount: 8, secBCount: 4 },

    { program: 'B.Tech', department: 'Electrical', year: 2, semester: 3, idPrefix: 'BTEE2', secACount: 8, secBCount: 4 },
    { program: 'B.Tech', department: 'Electrical', year: 4, semester: 7, idPrefix: 'BTEE4', secACount: 8, secBCount: 4 },

    { program: 'BBA', department: 'Business Administration', year: 2, semester: 3, idPrefix: 'BBA2', secACount: 8, secBCount: 4 },
    { program: 'BBA', department: 'Business Administration', year: 3, semester: 5, idPrefix: 'BBA3', secACount: 8, secBCount: 4 },

    { program: 'B.Sc', department: 'Computer Science', year: 1, semester: 1, idPrefix: 'BSCS1', secACount: 8, secBCount: 4 },
    { program: 'B.Sc', department: 'Computer Science', year: 3, semester: 5, idPrefix: 'BSCS3', secACount: 8, secBCount: 4 },

    { program: 'B.Sc', department: 'Mathematics', year: 1, semester: 1, idPrefix: 'BSCM1', secACount: 8, secBCount: 4 },
    { program: 'B.Sc', department: 'Mathematics', year: 2, semester: 3, idPrefix: 'BSCM2', secACount: 8, secBCount: 4 },

    { program: 'B.Sc', department: 'Physics', year: 2, semester: 3, idPrefix: 'BSCP2', secACount: 8, secBCount: 4 },
  ];

  for (const spec of cohortSpecs) {
    // Section A students
    for (let i = 0; i < spec.secACount; i++) {
      const name = studentPool[namePoolIdx % studentPool.length];
      namePoolIdx++;
      const isAarav = spec.hasDemoUser && i === 0;

      const risk: 'LOW' | 'MEDIUM' | 'HIGH' =
        isAarav ? 'MEDIUM' : i % 4 === 1 ? 'HIGH' : i % 2 === 0 ? 'LOW' : 'MEDIUM';

      studentPlans.push({
        name: isAarav ? 'Aarav Mehta' : name,
        studentId: isAarav ? 'BTCS25002' : `${spec.idPrefix}A${(i + 1).toString().padStart(2, '0')}`,
        email: isAarav
          ? 'student@eduguard.demo'
          : `stu.${spec.idPrefix.toLowerCase()}.a${i + 1}@eduguard.demo`,
        program: spec.program,
        department: spec.department,
        year: spec.year,
        semester: spec.semester,
        section: 'A',
        riskCategory: risk,
        isDemoStudentUser: isAarav,
      });
    }

    // Section B students
    for (let i = 0; i < spec.secBCount; i++) {
      const name = studentPool[namePoolIdx % studentPool.length];
      namePoolIdx++;
      const risk: 'LOW' | 'MEDIUM' | 'HIGH' = i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'LOW' : 'MEDIUM';

      studentPlans.push({
        name,
        studentId: `${spec.idPrefix}B${(i + 1).toString().padStart(2, '0')}`,
        email: `stu.${spec.idPrefix.toLowerCase()}.b${i + 1}@eduguard.demo`,
        program: spec.program,
        department: spec.department,
        year: spec.year,
        semester: spec.semester,
        section: 'B',
        riskCategory: risk,
      });
    }
  }

  console.log(`Prepared plan for ${studentPlans.length} students across all cohorts.`);

  // Create User accounts and Student docs
  const studentsToInsert: any[] = [];
  for (const sp of studentPlans) {
    let userId: mongoose.Types.ObjectId | undefined;
    if (sp.isDemoStudentUser) {
      const u = await User.create({
        name: sp.name,
        email: sp.email,
        passwordHash,
        role: 'STUDENT',
        institutionId: 'APEX-2026',
        status: 'ACTIVE',
      });
      userId = u._id;
    }

    studentsToInsert.push({
      userId,
      studentId: sp.studentId,
      name: sp.name,
      email: sp.email,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      program: sp.program,
      course: sp.program,
      department: sp.department,
      year: sp.year,
      semester: sp.semester,
      section: sp.section,
      academicYear: '2025-2026',
      status: 'ACTIVE',
      planMeta: sp,
    });
  }

  const createdStudents = await Student.insertMany(studentsToInsert);
  console.log(`Inserted ${createdStudents.length} student records into MongoDB.`);

  // 7. Seed Assignments per Subject
  console.log('7. Seeding Course Assignments...');
  const assignmentsData: any[] = [];
  for (const sub of subjects) {
    assignmentsData.push(
      {
        subjectId: sub._id,
        title: `${sub.code} - Assignment 1: Fundamental Concepts`,
        description: 'Comprehensive problem sheet covering modules 1 and 2.',
        dueDate: new Date('2026-09-15'),
        maximumMarks: 100,
        teacherId: teacherUser1._id,
      },
      {
        subjectId: sub._id,
        title: `${sub.code} - Assignment 2: Analytical Problem Solving`,
        description: 'Case analysis and algorithmic derivations.',
        dueDate: new Date('2026-10-10'),
        maximumMarks: 100,
        teacherId: teacherUser1._id,
      },
      {
        subjectId: sub._id,
        title: `${sub.code} - Assignment 3: Practical Implementation`,
        description: 'Applied implementation and experimental verification report.',
        dueDate: new Date('2026-11-05'),
        maximumMarks: 100,
        teacherId: teacherUser1._id,
      }
    );
  }
  const createdAssignments = await Assignment.insertMany(assignmentsData);
  const subjectAssignmentsMap = new Map<string, any[]>();
  createdAssignments.forEach((a) => {
    const k = a.subjectId.toString();
    if (!subjectAssignmentsMap.has(k)) subjectAssignmentsMap.set(k, []);
    subjectAssignmentsMap.get(k)!.push(a);
  });

  // Helper lookup for class IDs
  const classLookup = new Map<string, mongoose.Types.ObjectId>();
  createdClasses.forEach((c) => {
    const key = `${c.program}_${c.department}_${c.semester}_${c.section}`;
    classLookup.set(key, c._id as any);
  });

  // Deterministic PRNG for reproducible demo data (Requirement 4)
  function createSeededRandom(seed: number) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 8. Academic Records (Assessments, Attendance, Submissions, Study Logs, Participation, Predictions)
  console.log('8. Seeding granular Academic Records, Attendance, and Predictions...');

  const assessmentsToInsert: any[] = [];
  const attendanceToInsert: any[] = [];
  const submissionsToInsert: any[] = [];
  const studyLogsToInsert: any[] = [];
  const participationToInsert: any[] = [];
  const predictionsToInsert: any[] = [];
  const academicSummariesToInsert: any[] = [];
  const interventionsToInsert: any[] = [];

  const baseDate = new Date('2026-08-15');

  for (let i = 0; i < createdStudents.length; i++) {
    const student = createdStudents[i];
    const plan = studentPlans[i];
    const { program, department, semester, year, riskCategory } = plan;
    const studentPrng = createSeededRandom(5000 + i * 137);

    const prevScore =
      riskCategory === 'HIGH'
        ? 45 + Math.floor(studentPrng() * 12)
        : riskCategory === 'MEDIUM'
        ? 64 + Math.floor(studentPrng() * 10)
        : 78 + Math.floor(studentPrng() * 16);

    const intMarkPct =
      riskCategory === 'HIGH'
        ? 42 + Math.floor(studentPrng() * 14)
        : riskCategory === 'MEDIUM'
        ? 65 + Math.floor(studentPrng() * 10)
        : 80 + Math.floor(studentPrng() * 15);

    const assignPct =
      riskCategory === 'HIGH'
        ? 35 + Math.floor(studentPrng() * 25)
        : riskCategory === 'MEDIUM'
        ? 70 + Math.floor(studentPrng() * 12)
        : 88 + Math.floor(studentPrng() * 12);

    const studyHoursVal =
      riskCategory === 'HIGH'
        ? 2 + Math.floor(studentPrng() * 3) // 2-4 hrs
        : riskCategory === 'MEDIUM'
        ? 5 + Math.floor(studentPrng() * 3) // 5-7 hrs
        : 8 + Math.floor(studentPrng() * 5); // 8-12 hrs

    const partPct =
      riskCategory === 'HIGH'
        ? 35 + Math.floor(studentPrng() * 18)
        : riskCategory === 'MEDIUM'
        ? 62 + Math.floor(studentPrng() * 12)
        : 78 + Math.floor(studentPrng() * 18);

    // Multi-semester assessments: Prior semesters + Current semester
    for (let sem = 1; sem <= semester; sem++) {
      let semSubs = subjects.filter(
        (s) => s.program === program && s.department === department && s.semester === sem
      );

      if (semSubs.length === 0) {
        semSubs = subjects.filter((s) => s.program === program && s.semester === sem);
      }
      if (semSubs.length === 0) {
        semSubs = subjects.filter((s) => s.semester === sem).slice(0, 3);
      }

      for (const sub of semSubs) {
        const scale = (sem < semester ? prevScore : intMarkPct) / 100;

        const m1 = Math.min(25, Math.max(8, Math.round(25 * scale + (studentPrng() * 3 - 1.5))));
        const m2 = Math.min(25, Math.max(8, Math.round(25 * scale + (studentPrng() * 3 - 1.5))));
        const lab1 = Math.min(10, Math.max(3, Math.round(10 * scale + (studentPrng() * 2 - 1))));
        const lab2 = Math.min(10, Math.max(3, Math.round(10 * scale + (studentPrng() * 2 - 1))));
        const ext = Math.min(25, Math.max(8, Math.round(25 * scale + (studentPrng() * 3 - 1.5))));
        const assignMark = Math.min(10, Math.max(3, Math.round(10 * scale + (studentPrng() * 2 - 1))));

        assessmentsToInsert.push(
          { studentId: student._id, subjectId: sub._id, semester: sem, academicYear: '2025-2026', assessmentType: 'Mid 1', obtainedMarks: m1, maximumMarks: 25 },
          { studentId: student._id, subjectId: sub._id, semester: sem, academicYear: '2025-2026', assessmentType: 'Mid 2', obtainedMarks: m2, maximumMarks: 25 },
          { studentId: student._id, subjectId: sub._id, semester: sem, academicYear: '2025-2026', assessmentType: 'Internal Lab 1', obtainedMarks: lab1, maximumMarks: 10 },
          { studentId: student._id, subjectId: sub._id, semester: sem, academicYear: '2025-2026', assessmentType: 'Internal Lab 2', obtainedMarks: lab2, maximumMarks: 10 },
          { studentId: student._id, subjectId: sub._id, semester: sem, academicYear: '2025-2026', assessmentType: 'External Lab', obtainedMarks: ext, maximumMarks: 25 },
          { studentId: student._id, subjectId: sub._id, semester: sem, academicYear: '2025-2026', assessmentType: 'Assignment', obtainedMarks: assignMark, maximumMarks: 10 }
        );
      }
    }

    // Current Semester Subjects for Attendance, Assignments, Logs
    let curSubs = subjects.filter(
      (s) => s.program === program && s.department === department && s.semester === semester
    );
    if (curSubs.length === 0) {
      curSubs = subjects.filter((s) => s.program === program && s.semester === semester);
    }
    if (curSubs.length === 0) {
      curSubs = subjects.filter((s) => s.semester === semester).slice(0, 3);
    }

    const matchingClassId = classLookup.get(`${program}_${department}_${semester}_${student.section}`);

    // Attendance records (Requirements 1, 2, 3, 4, 11)
    // 30 classes across September (2026-09-01 to 2026-09-30) + 2 classes in October (2026-10-01 and 2026-10-02)
    let totalPresentAcrossSubs = 0;
    let totalClassesAcrossSubs = 0;

    for (let subIdx = 0; subIdx < curSubs.length; subIdx++) {
      const sub = curSubs[subIdx];
      const subPrng = createSeededRandom(1000 + i * 47 + subIdx * 193);

      // Student target attendance level (Requirements 1, 3 & 15)
      let targetPresent = 27; // out of 30 classes
      if (riskCategory === 'HIGH') {
        // High Risk: Very Low (<50%) or Low (50-69%)
        // E.g.: 11-14 presents (<50%) or 15-20 presents (50-66.7%)
        targetPresent = (i % 2 === 0)
          ? (11 + ((i * 3) % 4)) // 11, 14, 13, 12 out of 30 (36.7% - 46.7%)
          : (15 + ((i * 3) % 6)); // 15 to 20 out of 30 (50.0% - 66.7%)
      } else if (riskCategory === 'MEDIUM') {
        // Medium Risk: 70-85% attendance
        // E.g.: 21 to 25 presents (70.0% - 83.3%)
        targetPresent = 21 + ((i * 7 + subIdx) % 5); // 21, 22, 23, 24, 25 out of 30
      } else {
        // Low Risk: 90-95% attendance
        // E.g.: 27 to 29 presents (90.0% - 96.7%)
        targetPresent = 27 + ((i * 5 + subIdx) % 3); // 27, 28, 29 out of 30
      }

      const absentCount = 30 - targetPresent;

      // Deterministic Fisher-Yates shuffle to pick exactly which days are absent
      const days = Array.from({ length: 30 }, (_, idx) => idx + 1);
      for (let d = days.length - 1; d > 0; d--) {
        const j = Math.floor(subPrng() * (d + 1));
        [days[d], days[j]] = [days[j], days[d]];
      }
      const absentDaysSet = new Set(days.slice(0, absentCount));

      // Generate 30 September classes (01/09/2026 to 30/09/2026)
      for (let day = 1; day <= 30; day++) {
        const isPresent = !absentDaysSet.has(day);
        if (isPresent) totalPresentAcrossSubs++;
        totalClassesAcrossSubs++;

        const d = new Date(Date.UTC(2026, 8, day, 0, 0, 0, 0));
        attendanceToInsert.push({
          studentId: student._id,
          subjectId: sub._id,
          classId: matchingClassId,
          date: d,
          status: isPresent ? 'PRESENT' : 'ABSENT',
          markedBy: teacherUser1._id,
        });
      }

      // Plus October 1 and October 2 classes (Requirement 17)
      const isPresentOct1 = subPrng() < (targetPresent / 30);
      if (isPresentOct1) totalPresentAcrossSubs++;
      totalClassesAcrossSubs++;
      attendanceToInsert.push({
        studentId: student._id,
        subjectId: sub._id,
        classId: matchingClassId,
        date: new Date(Date.UTC(2026, 9, 1, 0, 0, 0, 0)),
        status: isPresentOct1 ? 'PRESENT' : 'ABSENT',
        markedBy: teacherUser1._id,
      });

      const isPresentOct2 = subPrng() < (targetPresent / 30);
      if (isPresentOct2) totalPresentAcrossSubs++;
      totalClassesAcrossSubs++;
      attendanceToInsert.push({
        studentId: student._id,
        subjectId: sub._id,
        classId: matchingClassId,
        date: new Date(Date.UTC(2026, 9, 2, 0, 0, 0, 0)),
        status: isPresentOct2 ? 'PRESENT' : 'ABSENT',
        markedBy: teacherUser1._id,
      });

      // Assignments for this subject
      const subAssigns = subjectAssignmentsMap.get(sub._id.toString()) || [];
      for (const assign of subAssigns) {
        const isSubmitted = subPrng() * 100 < assignPct;
        submissionsToInsert.push({
          assignmentId: assign._id,
          studentId: student._id,
          status: isSubmitted ? 'SUBMITTED' : 'NOT_SUBMITTED',
          submittedAt: isSubmitted ? new Date(baseDate) : undefined,
          obtainedMarks: isSubmitted ? Math.round(70 + subPrng() * 25) : 0,
        });
      }
    }

    // Exact calculated attendance percentage derived from real records! (Requirement 12)
    const attPct = totalClassesAcrossSubs > 0
      ? Math.round((totalPresentAcrossSubs / totalClassesAcrossSubs) * 1000) / 10
      : 80;

    // Weekly Study Logs
    for (let w = 1; w <= 4; w++) {
      studyLogsToInsert.push({
        studentId: student._id,
        hours: Math.round((studyHoursVal / 2) * 10) / 10,
        notes: `Weekly revision and laboratory preparation session #${w}`,
        date: new Date(baseDate.getTime() + w * 7 * 86400000),
      });
    }

    // Participation
    participationToInsert.push({
      studentId: student._id,
      subjectId: curSubs[0]?._id || subjects[0]._id,
      obtainedScore: partPct,
      maximumScore: 100,
      notes: 'Instructor assessment of lecture discussion and project engagement.',
      date: new Date(),
    });

    // Academic Record Summary doc
    academicSummariesToInsert.push({
      studentId: student._id,
      subjectId: curSubs[0]?._id || subjects[0]._id,
      academicYear: '2025-2026',
      semester,
      attendance: attPct,
      previousScore: prevScore,
      internalMarks: intMarkPct,
      assignmentCompletion: assignPct,
      studyHours: studyHoursVal,
      participation: partPct,
    });

    // AI Prediction matching actual features
    const featureInputs = {
      attendance: attPct,
      previousScore: prevScore,
      internalMarks: intMarkPct,
      assignmentCompletion: assignPct,
      studyHours: studyHoursVal,
      participation: partPct,
    };

    // Realistic predicted score estimation aligned with ANN weights
    let predScore =
      attPct * 0.3 +
      prevScore * 0.25 +
      intMarkPct * 0.25 +
      assignPct * 0.1 +
      Math.min(100, studyHoursVal * 8) * 0.05 +
      partPct * 0.05;

    predScore = Math.max(32, Math.min(97, Math.round(predScore * 10) / 10));

    let risk: RiskLevel = 'LOW';
    if (predScore < 55) risk = 'HIGH';
    else if (predScore < 70) risk = 'MEDIUM';

    const riskFactors = analyzeRiskFactors(featureInputs, DEFAULT_RISK_THRESHOLDS);
    const recommendations = generateRecommendations(risk, predScore, riskFactors);

    predictionsToInsert.push({
      studentId: student._id,
      modelVersion: 'v1.0.0',
      predictedScore: predScore,
      riskLevel: risk,
      inputSnapshot: featureInputs,
      riskFactors,
      recommendations,
      createdAt: new Date(),
    });

    // Interventions for High and Medium Risk students
    if (risk === 'HIGH' || (risk === 'MEDIUM' && i % 3 === 0)) {
      interventionsToInsert.push({
        studentId: student._id,
        teacherId: teacher1._id,
        type: risk === 'HIGH' ? 'ATTENDANCE_FOLLOWUP' : 'ACADEMIC_COUNSELING',
        title: risk === 'HIGH' ? 'Academic Recovery Mentorship Plan' : 'Bi-Weekly Tutoring Support',
        description:
          risk === 'HIGH'
            ? 'Scheduled one-on-one session regarding low attendance and incomplete coursework.'
            : 'Reviewing fundamental subject modules and setting up weekly milestones.',
        priority: risk === 'HIGH' ? 'HIGH' : 'MEDIUM',
        status: i % 2 === 0 ? 'IN_PROGRESS' : 'COMPLETED',
        dueDate: new Date(Date.now() + 14 * 86400000),
        outcome: i % 2 === 1 ? 'Student completed makeup tutorial sessions and submitted coursework.' : undefined,
      });
    }
  }

  console.log(`Writing records to MongoDB in optimized batches...`);
  console.log(`- Assessments: ${assessmentsToInsert.length}`);
  console.log(`- Attendance: ${attendanceToInsert.length}`);
  console.log(`- Submissions: ${submissionsToInsert.length}`);
  console.log(`- Predictions: ${predictionsToInsert.length}`);

  await Assessment.insertMany(assessmentsToInsert);
  await AttendanceRecord.insertMany(attendanceToInsert);
  await AssignmentSubmission.insertMany(submissionsToInsert);
  await StudyLog.insertMany(studyLogsToInsert);
  await ParticipationRecord.insertMany(participationToInsert);
  await AcademicRecord.insertMany(academicSummariesToInsert);
  await Prediction.insertMany(predictionsToInsert);
  await Intervention.insertMany(interventionsToInsert);

  console.log('====================================================');
  console.log(' DATABASE SEED COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('Summary of demo seed data:');
  console.log(` - Programs: 3 (B.Tech 4y/8sem, BBA 3y/6sem, B.Sc 3y/6sem)`);
  console.log(` - Departments: 9 (CSE, ECE, EEE, ME, CE, BBA, BSC-CS, BSC-MATH, BSC-PHYS)`);
  console.log(` - Classes: ${createdClasses.length}`);
  console.log(` - Subjects: ${subjects.length}`);
  console.log(` - Students: ${createdStudents.length} across all programs, departments, and cohorts`);
  console.log(` - Assessments: ${assessmentsToInsert.length}`);
  console.log(` - Attendance Records: ${attendanceToInsert.length}`);
  console.log(` - Predictions: ${predictionsToInsert.length}`);
  console.log(` - Interventions: ${interventionsToInsert.length}`);
  console.log('----------------------------------------------------');
  console.log('Login credentials:');
  console.log(' Admin:   admin@eduguard.demo   / EduGuard@2026!');
  console.log(' Teacher: teacher@eduguard.demo / EduGuard@2026!');
  console.log(' Student: student@eduguard.demo / EduGuard@2026! (Aarav Mehta BTCS25002)');
  console.log('====================================================');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Fatal error during seeding:', err.name, err.message);
  if (err.errors) {
    console.error('Validation details:', Object.entries(err.errors).map(([k, v]: any) => `${k}: ${v.message}`));
  }
  process.exit(1);
});
