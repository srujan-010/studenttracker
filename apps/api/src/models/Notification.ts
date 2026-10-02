import mongoose, { Document, Schema } from 'mongoose';
import { NotificationType } from '@eduguard/shared';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedStudentId?: mongoose.Types.ObjectId;
  relatedPredictionId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['RISK_ALERT', 'INTERVENTION_DUE', 'PREDICTION_READY', 'STUDENT_RISK_CHANGE', 'SYSTEM'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    relatedStudentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    relatedPredictionId: { type: Schema.Types.ObjectId, ref: 'Prediction' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
