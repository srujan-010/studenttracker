'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { AttentionRequiredTable } from '@/components/dashboard/AttentionRequiredTable';
import { dashboardApi, studentsApi, programsApi, departmentsApi } from '@/lib/apiClient';
import { DashboardSummaryDTO } from '@eduguard/shared';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  RefreshCw,
  ArrowRight,
  CalendarCheck,
  Award,
  FileCheck,
  Clock,
  Activity,
  GraduationCap,
  Filter,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, isStudent } = useAuth();
  const [data, setData] = useState<DashboardSummaryDTO | null>(null);
  const [studentData, setStudentData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cohort filters (Requirement 18)
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programFilter, setProgramFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');

  useEffect(() => {
    async function loadMeta() {
      try {
        const [progRes, deptRes] = await Promise.all([
          programsApi.getPrograms(),
          departmentsApi.getDepartments(),
        ]);
        if (progRes.data) setPrograms(progRes.data);
        if (deptRes.data) setDepartments(deptRes.data);
      } catch (e) {
        console.error('Failed to load metadata', e);
      }
    }
    loadMeta();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user?.role === 'STUDENT') {
        const res = await studentsApi.getMyProfile();
        if (res.data) {
          setStudentData(res.data);
        }
      } else {
        const res = await dashboardApi.getSummary({
          program: programFilter !== 'ALL' ? programFilter : undefined,
          department: deptFilter !== 'ALL' ? deptFilter : undefined,
          year: yearFilter !== 'ALL' ? yearFilter : undefined,
          semester: semesterFilter !== 'ALL' ? semesterFilter : undefined,
        });
        if (res.data) {
          setData(res.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load live dashboard information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user, programFilter, deptFilter, yearFilter, semesterFilter]);

  // Dependent filter options
  const selectedProg = programs.find((p) => p.name === programFilter);
  const maxYears = selectedProg?.durationYears || (programFilter === 'B.Tech' ? 4 : programFilter === 'ALL' ? 4 : 3);
  const availableYears = Array.from({ length: maxYears }, (_, i) => i + 1);

  const availableDepts =
    programFilter === 'ALL'
      ? departments
      : departments.filter((d) => d.program === programFilter);

  const semOptions =
    yearFilter !== 'ALL'
      ? [Number(yearFilter) * 2 - 1, Number(yearFilter) * 2]
      : Array.from({ length: maxYears * 2 }, (_, i) => i + 1);

  const resetFilters = () => {
    setProgramFilter('ALL');
    setDeptFilter('ALL');
    setYearFilter('ALL');
    setSemesterFilter('ALL');
  };

  // ==========================================
  // 1. STUDENT VIEW
  // ==========================================
  if (isStudent) {
    const latestPred = studentData?.latestPrediction;
    const calc = studentData?.calculatedMetrics || {};
    const score = latestPred ? Math.round(latestPred.predictedScore) : null;
    const risk = latestPred?.riskLevel;

    return (
      <AppLayout>
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Academic Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Welcome, {studentData?.name || 'Student'}. View your academic standing, expected score, and suggested support.
            </p>
          </div>

          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Expected Score & Status Highlight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Expected Score
                  </span>
                  <div className="mt-3">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {score !== null ? score : '—'}
                    </span>
                    <span className="text-base font-semibold text-slate-400"> / 100</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    AI estimation based on your coursework, assessments, and attendance.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Academic Risk Level
                  </span>
                  <div className="mt-3">
                    {risk === 'HIGH' ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        <span>🔴</span>
                        <span>HIGH RISK</span>
                      </span>
                    ) : risk === 'MEDIUM' ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <span>🟡</span>
                        <span>MEDIUM RISK</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span>🟢</span>
                        <span>LOW RISK</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {risk === 'HIGH'
                      ? 'Mentoring and dedicated attention advised.'
                      : risk === 'MEDIUM'
                      ? 'Stay on top of upcoming assignments and practical labs.'
                      : 'Progressing well within expected institutional targets.'}
                  </p>
                </div>
              </div>

              {/* 6 Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <CalendarCheck className="h-3.5 w-3.5 text-blue-600" /> Attendance
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {calc.attendance?.formattedValue || '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">Class lectures</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-600" /> Previous Marks
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {calc.previousScore?.formattedValue || '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">Prior semesters</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-blue-600" /> Assessments
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {calc.internalMarks?.formattedValue || '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">Internal score</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <FileCheck className="h-3.5 w-3.5 text-blue-600" /> Assignments
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {calc.assignmentCompletion?.formattedValue || '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">Coursework</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-600" /> Study Hours
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {calc.studyHours?.formattedValue || '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">Weekly logs</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-blue-600" /> Participation
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {calc.participation?.formattedValue || '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">In-class score</span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  Recommended Support for Your Academic Success
                </h3>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Maintain at least 75% attendance in all scheduled lectures and labs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Submit all course assignments prior to their stated deadlines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Utilize tutorial hours to ask questions regarding difficult concepts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Review previous examination questions to strengthen core fundamentals.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ==========================================
  // 2. TEACHER & ADMIN VIEW (Requirements 17 & 18)
  // ==========================================
  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* DEMO DATA Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-center justify-between text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong className="font-semibold">DEMO DATA MODE:</strong> Academic statistics, predictions, and student records are synthetic demo data generated for multi-program evaluation.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-200/60 rounded text-blue-900">
            Multi-Program College
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Teacher Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              College-wide academic risk overview and cohort attention requirements.
            </p>
          </div>
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors w-fit"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* ========================================================== */}
        {/* COHORT FILTER BAR (Requirement 18)                         */}
        {/* Program | Department | Year | Semester                     */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              <span>Filter Dashboard Cohort</span>
            </span>
            {(programFilter !== 'ALL' || deptFilter !== 'ALL' || yearFilter !== 'ALL' || semesterFilter !== 'ALL') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset Filter (Show All College)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Program */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Program</label>
              <select
                value={programFilter}
                onChange={(e) => {
                  setProgramFilter(e.target.value);
                  setDeptFilter('ALL');
                  setYearFilter('ALL');
                  setSemesterFilter('ALL');
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Programs (College-Wide)</option>
                {programs.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name} ({p.durationYears} Years)
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {availableDepts.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => {
                  const y = e.target.value;
                  setYearFilter(y);
                  setSemesterFilter('ALL');
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Years</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y === 1 ? '1st Year' : y === 2 ? '2nd Year' : y === 3 ? '3rd Year' : `${y}th Year`}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Semester</label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Semesters</option>
                {semOptions.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* 6 SUMMARY CARDS (Requirement 18)                           */}
        {/* Total Students | High Risk | Med Risk | Low Risk | Avg Pred | Avg Att */}
        {/* ========================================================== */}
        {loading || !data ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Students */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Students
              </span>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {data.totalStudents}
              </p>
              <span className="text-[10px] text-slate-400">Cohort size</span>
            </div>

            {/* High Risk */}
            <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
                <span>🔴</span> High Risk
              </span>
              <p className="text-2xl font-black text-red-600 mt-2">
                {data.highRiskCount}
              </p>
              <span className="text-[10px] text-red-600/70">Urgent support</span>
            </div>

            {/* Medium Risk */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <span>🟡</span> Medium Risk
              </span>
              <p className="text-2xl font-black text-amber-600 mt-2">
                {data.mediumRiskCount}
              </p>
              <span className="text-[10px] text-amber-600/70">Watchlist review</span>
            </div>

            {/* Low Risk */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <span>🟢</span> Low Risk
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-2">
                {data.lowRiskCount}
              </p>
              <span className="text-[10px] text-emerald-600/70">On track</span>
            </div>

            {/* Average Predicted Score */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" /> Avg Score
              </span>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {data.averagePredictedScore !== undefined ? `${data.averagePredictedScore}` : '—'}
                <span className="text-xs font-semibold text-slate-400"> / 100</span>
              </p>
              <span className="text-[10px] text-slate-400">Expected performance</span>
            </div>

            {/* Average Attendance */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <CalendarCheck className="h-3 w-3 text-blue-600" /> Avg Attendance
              </span>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {data.averageAttendance !== undefined ? `${data.averageAttendance}%` : '—'}
              </p>
              <span className="text-[10px] text-slate-400">Class lectures & labs</span>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STUDENTS REQUIRING ATTENTION TABLE (Requirement 17 & 18)   */}
        {/* ========================================================== */}
        {data && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Students Requiring Attention
                </h3>
                <p className="text-xs text-slate-500">
                  Students identified as high or medium risk based on academic records and attendance.
                </p>
              </div>
              <Link
                href="/students"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View All Students</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <AttentionRequiredTable students={data.studentsRequiringAttention} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
