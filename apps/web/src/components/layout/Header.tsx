'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, ShieldCheck, LogOut, CheckCircle2, AlertTriangle, Info, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Badge } from '@/components/ui/Badge';

export function Header({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-xs">
      {/* Institution Branding & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900">EduGuard</span>
            <span className="hidden sm:inline-block rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
              College Academic Portal
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden md:block">
            Student Performance & Early Warning Portal &bull; AY 2025-2026
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-semibold text-slate-900">Institutional Alerts</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No active notifications.
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'RISK_ALERT' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        ) : n.type === 'INTERVENTION_DUE' ? (
                          <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="mt-0.5 text-slate-600 line-clamp-2">{n.message}</p>
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-100 p-2 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  View all notifications &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge & Profile */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <Badge variant="role">{user.role}</Badge>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
