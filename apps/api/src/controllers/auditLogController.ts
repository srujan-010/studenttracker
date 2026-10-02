import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { action, entity, page = '1', limit = '50' } = req.query;

  try {
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (action && action !== 'ALL') query.action = action;
    if (entity && entity !== 'ALL') query.entity = entity;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: logs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs.',
      errors: [error.message],
    });
  }
}
