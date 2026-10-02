'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  GraduationCap,
  CalendarCheck,
  CheckSquare,
  FileBarChart2,
  BookOpen,
  Briefcase,
  Settings,
  Sparkles,
  Cpu,
  X,
  FileText,
  Clock,
  Activity,
  Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  highlight?: boolean;
}

export function Sidebar({
  isOpen = false,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, isAdmin, isTeacher, isStudent } = useAuth();

  // Strict role-based navigation per Requirements 17, 18, 19
  const teacherNav: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Academic Records', href: '/academic-records', icon: GraduationCap },
    { name: 'Assignments', href: '/assignments', icon: FileText },
    { name: 'Participation', href: '/participation', icon: Activity },
    { name: 'Early Warnings', href: '/early-warnings', icon: AlertTriangle, highlight: true },
    { name: 'Interventions', href: '/interventions', icon: CheckSquare },
  ];

  const studentNav: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Performance', href: '/performance', icon: GraduationCap },
    { name: 'My Assignments', href: '/assignments', icon: FileText },
    { name: 'My Study Log', href: '/study-log', icon: Clock },
    { name: 'My Recommendations', href: '/dashboard#recommendations', icon: Sparkles },
    { name: 'My Interventions', href: '/interventions', icon: CheckSquare },
  ];

  const adminNav: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Teachers', href: '/teachers', icon: Briefcase },
    { name: 'Classes', href: '/classes', icon: BookOpen },
    { name: 'Subjects', href: '/subjects', icon: Award },
    { name: 'Academic Records', href: '/academic-records', icon: GraduationCap },
    { name: 'Early Warnings', href: '/early-warnings', icon: AlertTriangle, highlight: true },
    { name: 'Reports', href: '/reports', icon: FileBarChart2 },
    { name: 'AI Model', href: '/model-details', icon: Cpu },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNav : isTeacher ? teacherNav : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:h-[calc(100vh-4rem)] md:sticky md:top-16 select-none ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          {/* Mobile Header in Drawer */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 md:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Navigation</span>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hidden md:block">
            Academic Portal
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${item.highlight && !isActive ? 'text-amber-700 hover:bg-amber-50/50' : ''}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive
                      ? 'text-blue-600'
                      : item.highlight
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Clean, Non-Technical Academic Portal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>EduGuard Portal</span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              Online
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Academic Year 2025–2026
          </p>
        </div>
      </aside>
    </>
  );
}

