'use client';

import React from 'react';
import {
  X,
  Calculator,
  CalendarCheck,
  Award,
  FileCheck,
  Clock,
  Activity,
  Database,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface MetricDetailModalProps {
  metricKey: string;
  calculatedData?: {
    value: number;
    formattedValue: string;
    subtext: string;
    formula: string;
    source: string;
    records?: any[];
    stats?: Record<string, any>;
  };
  onClose: () => void;
}

export function MetricDetailModal({
  metricKey,
  calculatedData,
  onClose,
}: MetricDetailModalProps) {
  if (!calculatedData) return null;

  const { value, formattedValue, subtext, formula, source, records = [], stats = {} } = calculatedData;

  // Metadata per metric
  const metaMap: Record<
    string,
    {
      title: string;
      icon: any;
      collection: string;
      color: string;
      formulaExplanation: string;
    }
  > = {
    attendance: {
      title: 'Attendance Calculation & Records',
      icon: CalendarCheck,
      collection: 'attendanceRecords',
      color: 'blue',
      formulaExplanation: 'Attendance % = (Present Classes / Total Classes) × 100',
    },
    previousScore: {
      title: 'Previous Academic Record & History',
      icon: Award,
      collection: 'academicRecords (Prior Semester Baseline)',
      color: 'purple',
      formulaExplanation: 'Previous Score = Final GPA / Grade Score from immediately preceding semester',
    },
    internalMarks: {
      title: 'Internal Marks & Assessments',
      icon: Award,
      collection: 'assessments',
      color: 'indigo',
      formulaExplanation: 'Internal Performance % = (Total Obtained Marks / Total Maximum Marks) × 100',
    },
    assignmentCompletion: {
      title: 'Assignment Submissions & Completion',
      icon: FileCheck,
      collection: 'assignmentSubmissions',
      color: 'emerald',
      formulaExplanation: 'Assignment Completion % = (Completed Assignments / Total Assignments) × 100',
    },
    studyHours: {
      title: 'Weekly Study Hours & Student Logs',
      icon: Clock,
      collection: 'studyLogs',
      color: 'amber',
      formulaExplanation: 'Weekly Study Hours = Sum of hours recorded by student across recent 7-day window',
    },
    participation: {
      title: 'Class Participation & Engagement Points',
      icon: Activity,
      collection: 'participationRecords',
      color: 'rose',
      formulaExplanation: 'Participation % = (Total Obtained Points / Total Maximum Points) × 100',
    },
  };

  const meta = metaMap[metricKey] || {
    title: 'Metric Calculation Details',
    icon: Calculator,
    collection: 'MongoDB Records',
    color: 'blue',
    formulaExplanation: 'Computed from underlying MongoDB records',
  };

  const IconComponent = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{meta.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                  <Database className="h-3 w-3 text-slate-400" />
                  Collection: <span className="font-semibold text-slate-700">{meta.collection}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Calculation Card */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Calculated Metric Value
                </span>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">
                  {formattedValue}
                </p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{subtext}</p>
              </div>

              {/* Mathematical Formula breakdown */}
              <div className="sm:max-w-md bg-white rounded-lg p-3 border border-blue-200 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <Calculator className="h-3.5 w-3.5 text-blue-600" />
                  <span>Mathematical Formula</span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">{meta.formulaExplanation}</p>
                <div className="mt-2 rounded bg-slate-900 px-2.5 py-1.5 font-mono text-xs font-semibold text-emerald-400">
                  {formula}
                </div>
              </div>
            </div>

            {/* Quick Stat Pills */}
            <div className="mt-4 pt-3 border-t border-blue-200/50 flex flex-wrap gap-2 text-xs">
              {metricKey === 'attendance' && (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100/80 text-emerald-800 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {stats.present ?? 0} Present
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100/80 text-rose-800 font-semibold">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    {stats.absent ?? 0} Absent
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-700 font-semibold border border-slate-200">
                    Total Classes: {stats.total ?? records.length}
                  </span>
                </>
              )}

              {metricKey === 'internalMarks' && (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100/80 text-blue-800 font-semibold">
                    Obtained: {stats.obtained ?? 0} Marks
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-700 font-semibold border border-slate-200">
                    Maximum: {stats.maximum ?? 0} Marks
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-700 font-semibold border border-slate-200">
                    Tests Recorded: {stats.count ?? records.length}
                  </span>
                </>
              )}

              {metricKey === 'assignmentCompletion' && (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100/80 text-emerald-800 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {stats.completed ?? 0} Submitted
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100/80 text-rose-800 font-semibold">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    {stats.notCompleted ?? 0} Not Submitted
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-700 font-semibold border border-slate-200">
                    Total Assignments: {stats.total ?? records.length}
                  </span>
                </>
              )}

              {metricKey === 'studyHours' && (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100/80 text-amber-800 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    {stats.weeklyHours ?? value} hrs/week
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-700 font-semibold border border-slate-200">
                    Logged Entries: {stats.totalEntries ?? records.length}
                  </span>
                </>
              )}

              {metricKey === 'participation' && (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100/80 text-rose-800 font-semibold">
                    Score: {stats.obtained ?? 0} / {stats.maximum ?? 0} Points
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-slate-700 font-semibold border border-slate-200">
                    Total Records: {stats.count ?? records.length}
                  </span>
                </>
              )}

              {metricKey === 'previousScore' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-100/80 text-purple-800 font-semibold">
                  Prior Semester Baseline Score: {value} / 100
                </span>
              )}
            </div>
          </div>

          {/* Subject-wise Attendance Breakdown (Requirement 10 & 13) */}
          {metricKey === 'attendance' && (calculatedData as any).bySubject && (calculatedData as any).bySubject.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>Subject-wise Attendance Breakdown</span>
                  <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-semibold">
                    {(calculatedData as any).bySubject.length} subjects
                  </span>
                </h3>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Subject</th>
                      <th className="px-4 py-2.5 text-center">Total Classes</th>
                      <th className="px-4 py-2.5 text-center">Present</th>
                      <th className="px-4 py-2.5 text-center">Absent</th>
                      <th className="px-4 py-2.5 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(calculatedData as any).bySubject.map((sub: any) => (
                      <tr key={sub.subjectId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {sub.name} <span className="text-[11px] font-mono text-slate-400">({sub.code})</span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-medium text-slate-600">{sub.total}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{sub.present}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-red-600">{sub.absent}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            sub.percentage >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            sub.percentage >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {sub.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Underlying Records List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Underlying MongoDB Records</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {records.length} {records.length === 1 ? 'record' : 'records'}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">Direct query snapshot</span>
            </div>

            {records.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <HelpCircle className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-600">No individual records found in MongoDB</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  This metric is currently using baseline profile data or default initial values.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      {metricKey === 'attendance' && (
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Subject</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Marked By</th>
                        </tr>
                      )}
                      {metricKey === 'internalMarks' && (
                        <tr>
                          <th className="px-4 py-2.5">Assessment Title</th>
                          <th className="px-4 py-2.5">Subject</th>
                          <th className="px-4 py-2.5">Type</th>
                          <th className="px-4 py-2.5 text-right">Obtained / Max</th>
                          <th className="px-4 py-2.5 text-right">Score %</th>
                        </tr>
                      )}
                      {metricKey === 'assignmentCompletion' && (
                        <tr>
                          <th className="px-4 py-2.5">Assignment</th>
                          <th className="px-4 py-2.5">Due Date</th>
                          <th className="px-4 py-2.5">Submission Status</th>
                          <th className="px-4 py-2.5">Submitted On</th>
                        </tr>
                      )}
                      {metricKey === 'studyHours' && (
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Subject</th>
                          <th className="px-4 py-2.5">Hours</th>
                          <th className="px-4 py-2.5">Topics / Notes</th>
                        </tr>
                      )}
                      {metricKey === 'participation' && (
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Subject</th>
                          <th className="px-4 py-2.5 text-right">Points</th>
                          <th className="px-4 py-2.5 text-right">Rating</th>
                        </tr>
                      )}
                      {metricKey === 'previousScore' && (
                        <tr>
                          <th className="px-4 py-2.5">Semester</th>
                          <th className="px-4 py-2.5">Academic Year</th>
                          <th className="px-4 py-2.5">CGPA / GPA</th>
                          <th className="px-4 py-2.5 text-right">Final Score</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {metricKey === 'attendance' &&
                        records.map((r, i) => (
                          <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-slate-700">
                              {r.date ? new Date(r.date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {r.subjectId?.name || r.subjectId?.code || 'Core Class'}
                            </td>
                            <td className="px-4 py-2.5">
                              {r.status === 'PRESENT' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" /> PRESENT
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                  <XCircle className="h-3 w-3" /> ABSENT
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                              {r.markedBy?.name || 'Class Faculty'}
                            </td>
                          </tr>
                        ))}

                      {metricKey === 'internalMarks' &&
                        records.map((r, i) => {
                          const pct = r.maximumMarks > 0 ? Math.round((r.obtainedMarks / r.maximumMarks) * 100) : 0;
                          return (
                            <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-2.5 font-medium text-slate-900">{r.title || 'Assessment'}</td>
                              <td className="px-4 py-2.5 text-slate-600">
                                {r.subjectId?.name || r.subjectId?.code || 'General'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 text-[11px]">{r.type}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">
                                {r.obtainedMarks} / {r.maximumMarks}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold">
                                <span
                                  className={
                                    pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'
                                  }
                                >
                                  {pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                      {metricKey === 'assignmentCompletion' &&
                        records.map((r, i) => (
                          <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-slate-900">
                              {r.assignmentId?.title || r.title || 'Assignment Task'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                              {r.assignmentId?.dueDate
                                ? new Date(r.assignmentId.dueDate).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              {r.status === 'SUBMITTED' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" /> SUBMITTED
                                </span>
                              ) : r.status === 'LATE' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                  <AlertCircle className="h-3 w-3" /> LATE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                  <XCircle className="h-3 w-3" /> NOT SUBMITTED
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                              {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}

                      {metricKey === 'studyHours' &&
                        records.map((r, i) => (
                          <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-slate-700">
                              {r.date ? new Date(r.date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {r.subjectId?.name || r.subjectId?.code || 'Self Study'}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{r.hours} hrs</td>
                            <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                              {r.topicsCovered || r.notes || 'Independent review'}
                            </td>
                          </tr>
                        ))}

                      {metricKey === 'participation' &&
                        records.map((r, i) => (
                          <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-slate-700">
                              {r.date ? new Date(r.date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {r.subjectId?.name || r.subjectId?.code || 'Lecture Session'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900">
                              {r.obtainedScore} / {r.maximumScore}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold">
                              {r.maximumScore > 0
                                ? `${Math.round((r.obtainedScore / r.maximumScore) * 100)}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}

                      {metricKey === 'previousScore' &&
                        records.map((r, i) => (
                          <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 font-semibold text-slate-900">Semester {r.semester}</td>
                            <td className="px-4 py-2.5 text-slate-600">{r.academicYear || 'Previous Year'}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-700">{r.gpa ?? '—'}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-600">
                              {r.finalScore ?? r.score ?? value} / 100
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Real-time calculation from verified MongoDB source documents.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
