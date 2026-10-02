'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotifications } from '@/context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Institutional Notification Center
              </h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              System alerts, student risk updates, and intervention deadlines.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            description="You have no notifications or alerts at this time."
          />
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => markAsRead(n._id)}
                className={`p-4 transition-colors flex items-start gap-4 cursor-pointer hover:bg-slate-50/80 ${
                  !n.read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="mt-0.5">
                  {n.type === 'RISK_ALERT' ? (
                    <div className="rounded-full bg-red-100 p-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  ) : n.type === 'INTERVENTION_DUE' ? (
                    <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                      <Clock className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                      <Info className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    <span className="text-[11px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{n.message}</p>

                  {(() => {
                    const rel = (n as any).relatedStudentId;
                    const relId = typeof rel === 'object' && rel !== null
                      ? (rel._id ? String(rel._id) : (rel.studentId ? String(rel.studentId) : null))
                      : (typeof rel === 'string' && rel ? rel : null);

                    if (!relId) return null;

                    return (
                      <div className="mt-2">
                        <Link
                          href={`/students/${relId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <span>View Student Profile</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
