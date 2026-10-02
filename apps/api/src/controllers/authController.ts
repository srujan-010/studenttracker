import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/environment';
import { logAuditEvent } from '../middleware/audit';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Please provide both email and password.',
    });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your institution administrator.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    await logAuditEvent(
      user._id.toString(),
      user.name,
      user.email,
      'LOGIN',
      'USER',
      user._id.toString(),
      { role: user.role },
      req.ip
    );

    res.json({
      success: true,
      message: 'Authentication successful.',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to authenticate user.',
      errors: [error.message],
    });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await logAuditEvent(
      req.user.id,
      req.user.name,
      req.user.email,
      'LOGOUT',
      'USER',
      req.user.id,
      {},
      req.ip
    );
  }
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated.' });
    return;
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  res.json({
    success: true,
    data: {
      ...user.toJSON(),
      teacherId: req.user.teacherId,
      studentId: req.user.studentId,
    },
  });
}

export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, email, password, role, institutionId } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({
      success: false,
      message: 'Name, email, password, and role are required.',
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long.',
    });
    return;
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      institutionId: institutionId || 'INST-001',
      status: 'ACTIVE',
    });

    await logAuditEvent(
      req.user?.id,
      req.user?.name,
      req.user?.email,
      'CREATE_USER',
      'USER',
      newUser._id.toString(),
      { role: newUser.role, email: newUser.email },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: newUser,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user.',
      errors: [error.message],
    });
  }
}
