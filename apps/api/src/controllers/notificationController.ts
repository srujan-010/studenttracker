import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .populate('relatedStudentId', 'studentId name department section')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      read: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
      errors: [error.message],
    });
  }
}

export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user?.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      errors: [error.message],
    });
  }
}

export async function markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
  try {
    await Notification.updateMany({ recipientId: req.user?.id, read: false }, { read: true });

    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications.',
      errors: [error.message],
    });
  }
}
