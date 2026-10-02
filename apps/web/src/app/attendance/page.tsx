'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  attendanceApi,
  subjectsApi,
  programsApi,
  departmentsApi,
} from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Users,
  Calendar,
  Filter,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SheetStudent {
  studentId: string;
  studentNumber: string;
  studentName: string;
  department?: string;
  section?: string;
  semester?: number;
  status: 'PRESENT' | 'ABSENT' | 'NOT_MARKED';
  currentAttendance?: {
    totalClasses: number;
    presentClasses: number;
    absentClasses: number;
    percentage: number;
    formatted: string;
  };
}

export default function AttendancePage() {
  const { isTeacher, isAdmin } = useAuth();

  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Selection states
  const [selectedProgram, setSelectedProgram] = useState('B.Tech');
  const [selectedDepartment, setSelectedDepartment] = useState('Computer Science');
  const [selectedYear, setSelectedYear] = useState<number>(2);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Default to 2026-09-01 (start of active lecture term with full 30-day attendance history)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-01');

  const [sheetLoading, setSheetLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Student rows in attendance sheet
  const [studentsSheet, setStudentsSheet] = useState<SheetStudent[]>([]);

  // Initial load: programs & departments metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const [progRes, deptRes] = await Promise.all([
          programsApi.getPrograms(),
          departmentsApi.getDepartments(),
        ]);
        if (progRes.data && progRes.data.length > 0) {
          setPrograms(progRes.data);
        }
        if (deptRes.data && deptRes.data.length > 0) {
          setDepartments(deptRes.data);
          const matched = deptRes.data.find((d: any) => d.program === 'B.Tech') || deptRes.data[0];
          setSelectedDepartment(matched.name);
        }
      } catch (e: any) {
        console.error('Failed to load initial metadata', e);
      }
    }
    loadMeta();
  }, []);

  // Derived options based on program duration
  const filteredDepartments = departments.filter((d) => d.program === selectedProgram);
  const currentProgramDoc = programs.find((p) => p.name === selectedProgram);
  const maxYears = currentProgramDoc?.durationYears || (selectedProgram === 'B.Tech' ? 4 : 3);
  const yearOptions = Array.from({ length: maxYears }, (_, i) => i + 1);
  const semesterOptions = [(selectedYear - 1) * 2 + 1, (selectedYear - 1) * 2 + 2];

  // Program change handler ensuring dependent state is updated
  const handleProgramChange = (progName: string) => {
    setSelectedProgram(progName);
    const progDepts = departments.filter((d) => d.program === progName);
    if (progDepts.length > 0) {
      setSelectedDepartment(progDepts[0].name);
    }
    setSelectedYear(1);
    setSelectedSemester(1);
  };

  // Year change handler updating dependent semester options
  const handleYearChange = (yearNum: number) => {
    setSelectedYear(yearNum);
    const newSem = (yearNum - 1) * 2 + 1;
    setSelectedSemester(newSem);
  };

  // Fetch subjects when program, department, semester change
  useEffect(() => {
    async function loadSubjects() {
      if (!selectedProgram || !selectedDepartment || !selectedSemester) return;
      try {
        const res = await subjectsApi.getSubjects({
          program: selectedProgram,
          department: selectedDepartment,
          semester: selectedSemester,
        });
        if (res.data && res.data.length > 0) {
          setSubjects(res.data);
          setSelectedSubjectId(res.data[0]._id);
        } else {
          setSubjects([]);
          setSelectedSubjectId('');
        }
      } catch (e) {
        console.error('Failed to load subjects', e);
      }
    }
    loadSubjects();
  }, [selectedProgram, selectedDepartment, selectedSemester]);

  // Fetch attendance sheet from MongoDB for selected parameters and date
  const loadSheet = useCallback(async () => {
    if (!selectedDepartment || !selectedSemester || !selectedSection || !selectedDate) return;

    setSheetLoading(true);
    setMessage(null);
    try {
      const res = await attendanceApi.getSheet({
        program: selectedProgram,
        department: selectedDepartment,
        year: selectedYear,
        semester: selectedSemester,
        section: selectedSection,
        subjectId: selectedSubjectId || undefined,
        date: selectedDate,
      });

      if (res.data && Array.isArray(res.data.students)) {
        setStudentsSheet(res.data.students);
      } else {
        setStudentsSheet([]);
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Failed to load attendance sheet.',
        isError: true,
      });
    } finally {
      setSheetLoading(false);
    }
  }, [
    selectedProgram,
    selectedDepartment,
    selectedYear,
    selectedSemester,
    selectedSection,
    selectedSubjectId,
    selectedDate,
  ]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const handleToggleStatus = (studentId: string, newStatus: 'PRESENT' | 'ABSENT') => {
    setStudentsSheet((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    setStudentsSheet((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubjectId) {
      setMessage({ text: 'Please select a subject to record attendance.', isError: true });
      return;
    }

    // Filter only students that have been marked
    const markedStudents = studentsSheet.filter(
      (s) => s.status === 'PRESENT' || s.status === 'ABSENT'
    );

    if (markedStudents.length === 0) {
      setMessage({
        text: 'No attendance marked yet. Please mark at least one student before saving.',
        isError: true,
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const records = markedStudents.map((s) => ({
        studentId: s.studentId,
        status: s.status,
      }));

      await attendanceApi.saveBatch({
        subjectId: selectedSubjectId,
        date: selectedDate,
        records,
      });

      setMessage({
        text: `Attendance saved successfully for ${records.length} students on ${selectedDate}. MongoDB updated.`,
        isError: false,
      });

      // Reload sheet to reflect updated statistics from MongoDB
      await loadSheet();

      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Failed to save attendance records.',
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculations for session status bar (Requirement 14)
  const totalCount = studentsSheet.length;
  const presentCount = studentsSheet.filter((s) => s.status === 'PRESENT').length;
  const absentCount = studentsSheet.filter((s) => s.status === 'ABSENT').length;
  const notMarkedCount = studentsSheet.filter((s) => s.status === 'NOT_MARKED').length;
  // Day Attendance: Present / Total Enrolled × 100
  const dayAttendancePct =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 1000) / 10 : 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ========================================================== */}
        {/* DEMO DATA NOTICE (Requirement 22)                         */}
        {/* ========================================================== */}
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-amber-200 px-2 py-0.5 font-bold text-amber-950 uppercase tracking-wider text-[10px]">
              DEMO DATA
            </span>
            <span>
              Real-time date-based attendance with MongoDB persistence. Each student maintains realistic individual attendance percentages.
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] font-mono font-medium text-amber-700">
            Active Term: Sep - Oct 2026
          </span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Attendance Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select date and cohort to view or record lecture attendance. Stored directly in MongoDB.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSheet}
              disabled={sheetLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${sheetLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Date</span>
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* SELECTION BAR                                             */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="h-4 w-4 text-blue-600" />
            <span>Select Class, Subject & Lecture Date</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Program */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
              >
                {programs.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.durationYears} Years)
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((d) => (
                    <option key={d._id || d.name} value={d.name}>
                      {d.name} {d.code && d.code !== d.name ? `(${d.code})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="Computer Science">Computer Science</option>
                )}
              </select>
            </div>

            {/* Year (Dependent on Program duration) */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y === 1 ? '1st Year' : y === 2 ? '2nd Year' : y === 3 ? '3rd Year' : `${y}th Year`}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester (Dependent on Year) */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {semesterOptions.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 font-medium focus:border-blue-500 focus:outline-none"
              >
                {subjects.length > 0 ? (
                  subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))
                ) : (
                  <option value="">No subjects found</option>
                )}
              </select>
            </div>

            {/* Lecture Date Picker */}
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">
                Lecture Date (Select any date to view historical attendance)
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-blue-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* SESSION STATS BAR (Requirement 2 & 7)                      */}
        {/* ========================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400">Total Enrolled</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-600">Present</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{presentCount}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/30 p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-red-600">Absent</span>
            <p className="text-xl font-bold text-red-600 mt-1">{absentCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Not Marked</span>
            <p className="text-xl font-bold text-slate-600 mt-1">{notMarkedCount}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-blue-600">Day Attendance</span>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {totalCount > 0 && (presentCount > 0 || absentCount > 0) ? `${dayAttendancePct}%` : totalCount > 0 ? '0%' : '—'}
            </p>
          </div>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`rounded-xl border p-4 text-xs font-semibold flex items-center gap-2 ${
              message.isError
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {message.isError ? (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* ========================================================== */}
        {/* ATTENDANCE SHEET TABLE (Requirement 6, 7 & 8)              */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Attendance Sheet</h3>
                <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-mono font-bold border border-blue-100">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays actual status recorded for this date. Unknown dates show &ldquo;Not Marked&rdquo;.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAll('PRESENT')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('ABSENT')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Mark All Absent
              </button>
              {(isAdmin || isTeacher) && studentsSheet.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
                </button>
              )}
            </div>
          </div>

          {sheetLoading ? (
            <LoadingSkeleton rows={6} />
          ) : studentsSheet.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Students Found"
              description={`No students found in ${selectedProgram} - ${selectedDepartment}, Year ${selectedYear}, Semester ${selectedSemester}, Section ${selectedSection}.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    {/* Requirement 6: Current Attendance % column */}
                    <th className="py-3 px-4 text-center">Current Attendance %</th>
                    {/* Requirement 6 & 8: Today's Status */}
                    <th className="py-3 px-4 text-center">Date Status ({selectedDate})</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsSheet.map((student) => {
                    const currentPct = student.currentAttendance?.percentage ?? 0;
                    const totalRecorded = student.currentAttendance?.totalClasses ?? 0;
                    const presentRecorded = student.currentAttendance?.presentClasses ?? 0;

                    const pctStyle =
                      totalRecorded === 0
                        ? 'bg-slate-50 text-slate-500 border-slate-200'
                        : currentPct >= 85
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : currentPct >= 75
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : currentPct >= 60
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200';

                    return (
                      <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {student.studentNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{student.studentName}</span>
                          <div className="text-[11px] text-slate-400">
                            {student.department || selectedDepartment} &bull; Sec {student.section || selectedSection}
                          </div>
                        </td>

                        {/* Current Attendance % (Requirement 6 & 9) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${pctStyle}`}>
                              {totalRecorded > 0 ? `${currentPct}%` : 'No History'}
                            </span>
                            {totalRecorded > 0 && (
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {presentRecorded} of {totalRecorded} attended
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date Status (Requirement 7 & 8) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {student.status === 'PRESENT' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>✓</span>
                              <span>Present</span>
                            </span>
                          ) : student.status === 'ABSENT' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              <span>✕</span>
                              <span>Absent</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span>○</span>
                              <span>Not Marked</span>
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(student.studentId, 'PRESENT')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                student.status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(student.studentId, 'ABSENT')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                student.status === 'ABSENT'
                                  ? 'bg-red-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {(isAdmin || isTeacher) && studentsSheet.length > 0 && (
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Changes will be saved to MongoDB for date <strong>{selectedDate}</strong> and immediately recalculate student attendance rates.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : `Save Attendance (${selectedDate})`}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
