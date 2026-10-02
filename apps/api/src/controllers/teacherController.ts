import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Teacher } from '../models/Teacher';
import { User } from '../models/User';
import { logAuditEvent } from '../middleware/audit';

export async function getTeachers(req: Request, res: Response): Promise<void> {
  try {
    const teachers = await Teacher.find()
      .populate('userId', 'name email status lastLoginAt')
      .populate('assignedSubjects', 'name code credits')
      .populate('assignedClasses', 'name department semester section')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teachers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve teachers.',
      errors: [error.message],
    });
  }
}

export async function createTeacher(req: Request, res: Response): Promise<void> {
  const { name, email, password, employeeId, department, assignedSubjects, assignedClasses } = req.body;

  if (!name || !email || !password || !employeeId || !department) {
    res.status(400).json({
      success: false,
      message: 'Name, email, password, employeeId, and department are required.',
    });
    return;
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const existingTeacher = await Teacher.findOne({ employeeId: employeeId.toUpperCase().trim() });
    if (existingTeacher) {
      res.status(409).json({ success: false, message: 'Teacher with this Employee ID already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'TEACHER',
      status: 'ACTIVE',
    });

    const teacher = await Teacher.create({
      userId: user._id,
      employeeId: employeeId.toUpperCase().trim(),
      department: department.trim(),
      assignedSubjects: assignedSubjects || [],
      assignedClasses: assignedClasses || [],
    });

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_TEACHER',
      'TEACHER',
      teacher._id.toString(),
      { employeeId: teacher.employeeId, email: user.email },
      req.ip
    );

    const populated = await Teacher.findById(teacher._id)
      .populate('userId', 'name email status')
      .populate('assignedSubjects')
      .populate('assignedClasses');

    res.status(201).json({
      success: true,
      message: 'Teacher profile created successfully.',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create teacher.',
      errors: [error.message],
    });
  }
}

export async function updateTeacher(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { department, assignedSubjects, assignedClasses, name } = req.body;

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found.' });
      return;
    }

    if (department) teacher.department = department;
    if (assignedSubjects) teacher.assignedSubjects = assignedSubjects;
    if (assignedClasses) teacher.assignedClasses = assignedClasses;

    await teacher.save();

    if (name) {
      await User.findByIdAndUpdate(teacher.userId, { name });
    }

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'UPDATE_TEACHER',
      'TEACHER',
      teacher._id.toString(),
      { employeeId: teacher.employeeId },
      req.ip
    );

    const populated = await Teacher.findById(teacher._id)
      .populate('userId', 'name email status')
      .populate('assignedSubjects')
      .populate('assignedClasses');

    res.json({
      success: true,
      message: 'Teacher profile updated successfully.',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher.',
      errors: [error.message],
    });
  }
}
