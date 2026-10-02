import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

export async function logAuditEvent(
  userId: string | undefined,
  userName: string | undefined,
  userEmail: string | undefined,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: any,
  ipAddress?: string
): Promise<void> {
  try {
    await AuditLog.create({
      userId,
      userName,
      userEmail,
      action,
      entity,
      entityId,
      metadata,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (err: any) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
}
