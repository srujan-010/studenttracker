'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { InterventionModal } from '@/components/students/InterventionModal';
import { MetricDetailModal } from '@/components/students/MetricDetailModal';
import { studentsApi, predictionsApi } from '@/lib/apiClient';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Award,
  BookOpen,
  FileCheck,
  Clock,
  Activity,
  PlusCircle,
  Play,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { StudentFullAcademicHistoryDTO, YearAcademicHistory, SemesterAcademicHistory } from '@eduguard/shared';

export default function StudentDetailPage() {
  const params = useParams();
  const { isAdmin, isTeacher } = useAuth();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prediction execution state
  const [predicting, setPredicting] = useState(false);
  const [predictSuccess, setPredictSuccess] = useState<string | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Intervention & Metric Detail modal
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [activeMetricModal, setActiveMetricModal] = useState<string | null>(null);

  // Accordion state: Year & Semester open/close
  // Active semester auto-expanded
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [expandedSemesters, setExpandedSemesters] = useState<Record<number, boolean>>({});

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentsApi.getStudentById(studentId);
      if (res.data) {
        setStudent(res.data);

        // Auto-expand current year and semester
        const curYear = res.data.year || Math.ceil((res.data.semester || 1) / 2);
        const curSem = res.data.semester || 1;
        setExpandedYears((prev) => ({ ...prev, [curYear]: true }));
        setExpandedSemesters((prev) => ({ ...prev, [curSem]: true }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchProfile();
    }
  }, [studentId]);

  const toggleYear = (yearNum: number) => {
    setExpandedYears((prev) => ({ ...prev, [yearNum]: !prev[yearNum] }));
  };

  const toggleSemester = (semNum: number) => {
    setExpandedSemesters((prev) => ({ ...prev, [semNum]: !prev[semNum] }));
  };

  const handleRunPrediction = async () => {
    setPredicting(true);
    setPredictSuccess(null);
    setPredictError(null);

    try {
      const res = await predictionsApi.generate(student._id);
      if (res.data) {
        setPredictSuccess('AI Prediction updated successfully.');
        await fetchProfile();
        setTimeout(() => setPredictSuccess(null), 4000);
      }
    } catch (err: any) {
      const msg =
        err.response?.status === 503
          ? 'AI prediction microservice is starting up. Please try again in a few seconds.'
          : err.response?.data?.message || 'Unable to generate prediction. Please check student records.';
      setPredictError(msg);
      setTimeout(() => setPredictError(null), 6000);
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-5xl">
          <LoadingSkeleton rows={6} />
        </div>
      </AppLayout>
    );
  }

  if (error || !student) {
    return (
      <AppLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-lg mx-auto mt-12">
          <p className="text-sm font-semibold text-red-700">{error || 'Student not found.'}</p>
          <Link
            href="/students"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Link>
        </div>
      </AppLayout>
    );
  }

  const latestPred = student.latestPrediction;
  const calc = student?.calculatedMetrics || {};
  const academicHistory: StudentFullAcademicHistoryDTO = student.academicHistory;

  const score = latestPred ? Math.round(latestPred.predictedScore) : null;
  const risk = latestPred?.riskLevel;

  // Extract human-friendly areas of attention
  const getAttentionPoints = (): string[] => {
    if (!latestPred || !latestPred.riskFactors || latestPred.riskFactors.length === 0) {
      const att = calc.attendance?.value ?? 100;
      const internal = calc.internalMarks?.value ?? 100;
      const assign = calc.assignmentCompletion?.value ?? 100;
      const points: string[] = [];
      if (att < 75) points.push(`Low attendance (${calc.attendance?.formattedValue || att + '%'})`);
      if (internal < 50) points.push(`Low assessment performance (${calc.internalMarks?.formattedValue || internal + '%'})`);
      if (assign < 70) points.push(`Low assignment completion (${calc.assignmentCompletion?.formattedValue || assign + '%'})`);
      return points.length > 0 ? points : ['All primary metrics meet institutional targets'];
    }

    return latestPred.riskFactors.map((rf: any) => {
      const f = rf.factor.toLowerCase();
      if (f.includes('attendance')) return 'Low attendance in lectures and practical sessions';
      if (f.includes('internal')) return 'Low assessment performance in internal tests';
      if (f.includes('previous')) return 'Prior semester academic performance is below target';
      if (f.includes('assignment')) return 'Pending or incomplete coursework assignments';
      if (f.includes('study')) return 'Low weekly independent self-study hours';
      if (f.includes('participation')) return 'Low active in-class participation';
      return rf.description || rf.factor;
    });
  };

  const getRecommendations = (): string[] => {
    if (latestPred?.recommendations && latestPred.recommendations.length > 0) {
      return latestPred.recommendations;
    }
    return [
      'Discuss attendance with the student and identify scheduling barriers',
      'Encourage completion and submission of pending coursework assignments',
      'Provide tutorial support and review difficult subject concepts',
      'Suggest a structured weekly independent study timetable',
    ];
  };

  const attentionPoints = getAttentionPoints();
  const recommendations = getRecommendations();

  const standardAssessments = [
    { key: 'Mid 1', label: 'Mid 1', defaultMax: 25 },
    { key: 'Mid 2', label: 'Mid 2', defaultMax: 25 },
    { key: 'Internal Lab 1', label: 'Internal Lab 1', defaultMax: 10 },
    { key: 'Internal Lab 2', label: 'Internal Lab 2', defaultMax: 10 },
    { key: 'External Lab', label: 'External Lab', defaultMax: 25 },
    { key: 'Assignment', label: 'Assignment', defaultMax: 10 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* ========================================================== */}
        {/* TOP PROFILE HEADER                                         */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link
                href="/students"
                className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                title="Back to Students list"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">{student.name}</h1>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                    {student.studentId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-1.5 flex-wrap">
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {student.program || student.course || 'B.Tech'}
                  </span>
                  <span>&bull;</span>
                  <span>{student.department}</span>
                  <span>&bull;</span>
                  <span>{student.year} Year</span>
                  <span>&bull;</span>
                  <span>Semester {student.semester}</span>
                  <span>&bull;</span>
                  <span>Section {student.section}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(isAdmin || isTeacher) && (
                <>
                  <button
                    type="button"
                    onClick={handleRunPrediction}
                    disabled={predicting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-100 transition-colors disabled:opacity-60"
                  >
                    <Play className={`h-3.5 w-3.5 ${predicting ? 'animate-spin' : ''}`} />
                    <span>{predicting ? 'Running ANN...' : 'Run AI Prediction'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowInterventionModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Add Intervention</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Feedback Banners */}
          {predictSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{predictSuccess}</span>
            </div>
          )}
          {predictError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{predictError}</span>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* CURRENT PERFORMANCE SUMMARY (6 Academic Features)         */}
        {/* ========================================================== */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
            Current Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Attendance */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <CalendarCheck className="h-3.5 w-3.5 text-blue-600" /> Attendance
                </span>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {calc.attendance?.formattedValue || '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {calc.attendance?.subtext || 'From attendance logs'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMetricModal('attendance')}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors pt-2 border-t border-slate-100"
              >
                <span>View Attendance</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* 2. Previous Performance */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-600" /> Previous Marks
                </span>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {calc.previousScore?.formattedValue || '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {calc.previousScore?.subtext || 'From previous semesters'}
                </p>
              </div>
            </div>

            {/* 3. Current Assessment Performance */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-blue-600" /> Assessment Marks
                </span>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {calc.internalMarks?.formattedValue || '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Assessment Performance
                </p>
              </div>
            </div>

            {/* 4. Assignments */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <FileCheck className="h-3.5 w-3.5 text-blue-600" /> Assignments
                </span>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {calc.assignmentCompletion?.formattedValue || '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {calc.assignmentCompletion?.subtext || 'Course assignments'}
                </p>
              </div>
            </div>

            {/* 5. Study Hours */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-blue-600" /> Study Hours
                </span>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {calc.studyHours?.formattedValue || '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {calc.studyHours?.subtext || 'Weekly hours logged'}
                </p>
              </div>
            </div>

            {/* 6. Participation */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-blue-600" /> Participation
                </span>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {calc.participation?.formattedValue || '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {calc.participation?.subtext || 'Class engagement'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* AI PERFORMANCE PREDICTION                                  */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>AI Performance Prediction</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Neural network score estimate based on student attendance and academic records.
              </p>
            </div>
            {latestPred?.createdAt && (
              <span className="text-[11px] text-slate-400">
                Last Evaluated: {new Date(latestPred.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {latestPred ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Expected Score
                </span>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-slate-900">{score}</span>
                  <span className="text-base font-semibold text-slate-400"> / 100</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Model estimation for end-of-semester overall academic performance.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Risk Level
                </span>
                <div className="mt-2">
                  {risk === 'HIGH' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                      <span>🔴</span>
                      <span>HIGH RISK</span>
                    </span>
                  ) : risk === 'MEDIUM' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <span>🟡</span>
                      <span>MEDIUM RISK</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span>🟢</span>
                      <span>LOW RISK</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {risk === 'HIGH'
                    ? 'Student requires prompt academic support and faculty mentoring.'
                    : risk === 'MEDIUM'
                    ? 'Student is on the watchlist; monitor upcoming assessment submissions.'
                    : 'Student is demonstrating consistent on-track academic progress.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl">
              No prediction generated yet. Click &quot;Run AI Prediction&quot; to evaluate this student.
            </div>
          )}

          {/* Areas That May Need Attention & Recommended Support */}
          {latestPred && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  Areas That May Need Attention
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {attentionPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  Recommended Support
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* ACADEMIC HISTORY (Year by Year -> Semester -> Subject)     */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>Academic History</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive semester and assessment record across all academic years.
            </p>
          </div>

          {academicHistory && academicHistory.years && academicHistory.years.length > 0 ? (
            <div className="space-y-3">
              {academicHistory.years.map((yearItem: YearAcademicHistory) => {
                const isYearExpanded = !!expandedYears[yearItem.year];

                return (
                  <div
                    key={yearItem.year}
                    className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                  >
                    {/* Year Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleYear(yearItem.year)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        {isYearExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        )}
                        <span className="text-sm font-bold text-slate-900">
                          {yearItem.yearLabel}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {yearItem.semesters.length} Semesters
                      </span>
                    </button>

                    {/* Semesters inside Year */}
                    {isYearExpanded && (
                      <div className="p-4 space-y-4 divide-y divide-slate-100">
                        {yearItem.semesters.map((semItem: SemesterAcademicHistory) => {
                          const isSemExpanded = !!expandedSemesters[semItem.semester];
                          const isCurrentSemester = semItem.semester === student.semester;

                          return (
                            <div key={semItem.semester} className="pt-3 first:pt-0">
                              {/* Semester Header */}
                              <div
                                onClick={() => toggleSemester(semItem.semester)}
                                className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg bg-slate-50/70 hover:bg-blue-50/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {isSemExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-blue-600" />
                                  )}
                                  <span className="text-xs font-bold text-slate-800">
                                    Semester {semItem.semester}
                                  </span>
                                  {isCurrentSemester && (
                                    <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5">
                                      Active Semester
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {semItem.totalMaximum > 0 ? (
                                    <span className="font-semibold text-slate-700">
                                      Assessment Performance: {semItem.assessmentPerformance}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">No marks recorded</span>
                                  )}
                                </div>
                              </div>

                              {/* Subjects and Marks */}
                              {isSemExpanded && (
                                <div className="mt-3 space-y-3 pl-2 sm:pl-4">
                                  {semItem.subjects.length > 0 ? (
                                    semItem.subjects.map((sub) => (
                                      <div
                                        key={sub.subjectId}
                                        className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs"
                                      >
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <div>
                                            <span className="text-xs font-bold text-slate-900">
                                              {sub.name}
                                            </span>
                                            <span className="ml-2 font-mono text-[11px] text-slate-500">
                                              ({sub.code})
                                            </span>
                                          </div>
                                          {sub.totalMaximum > 0 ? (
                                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                              Assessment: {sub.totalObtained} / {sub.totalMaximum} ({sub.assessmentPerformance}%)
                                            </span>
                                          ) : (
                                            <span className="text-[11px] text-slate-400 italic">
                                              No marks entered
                                            </span>
                                          )}
                                        </div>

                                        {/* 6 Standard Assessments Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs">
                                          {standardAssessments.map((sa) => {
                                            const mark = sub.marks[sa.key];
                                            return (
                                              <div
                                                key={sa.key}
                                                className={`p-2 rounded-md border text-center ${
                                                  mark
                                                    ? 'bg-slate-50/80 border-slate-200 text-slate-800'
                                                    : 'bg-slate-50/30 border-slate-100 text-slate-400'
                                                }`}
                                              >
                                                <div className="text-[11px] font-medium text-slate-500">
                                                  {sa.label}
                                                </div>
                                                <div className="font-semibold text-xs mt-0.5">
                                                  {mark ? (
                                                    <span>
                                                      {mark.obtainedMarks}{' '}
                                                      <span className="text-slate-400 font-normal">
                                                        / {mark.maximumMarks}
                                                      </span>
                                                    </span>
                                                  ) : (
                                                    <span className="text-slate-400">—</span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 italic py-2">
                                      No curriculum subjects scheduled for this semester.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No academic history records found.
            </p>
          )}
        </div>

        {/* ========================================================== */}
        {/* INTERVENTION HISTORY                                       */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Intervention History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Past and ongoing academic support interventions created by faculty.
              </p>
            </div>
            {(isAdmin || isTeacher) && (
              <button
                type="button"
                onClick={() => setShowInterventionModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Add Intervention</span>
              </button>
            )}
          </div>

          {student.interventions && student.interventions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {student.interventions.map((inv: any) => (
                <div key={inv._id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{inv.title}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        inv.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-slate-600">{inv.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                    <span>Type: {inv.type?.replace(/_/g, ' ')}</span>
                    {inv.dueDate && (
                      <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                    )}
                    {inv.outcome && (
                      <span className="text-emerald-700 font-semibold">
                        Outcome: {inv.outcome}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No interventions currently scheduled for this student.
            </p>
          )}
        </div>
      </div>

      {/* Intervention Modal */}
      {showInterventionModal && (
        <InterventionModal
          studentId={student._id}
          studentName={student.name}
          predictionId={latestPred?._id}
          onSuccess={() => {
            fetchProfile();
            setShowInterventionModal(false);
          }}
          onClose={() => setShowInterventionModal(false)}
        />
      )}

      {/* Metric Detail Modal (Requirements 13 & 14: Subject-wise breakdown & History) */}
      {activeMetricModal && (
        <MetricDetailModal
          metricKey={activeMetricModal}
          calculatedData={calc[activeMetricModal]}
          onClose={() => setActiveMetricModal(null)}
        />
      )}
    </AppLayout>
  );
}
