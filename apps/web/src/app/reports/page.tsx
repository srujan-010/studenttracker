'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { reportsApi, studentsApi } from '@/lib/apiClient';
import {
  Printer,
  FileText,
  ShieldCheck,
  Award,
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';

function ReportsContent() {
  const searchParams = useSearchParams();
  const queryStudentId = searchParams.get('studentId');

  const [activeTab, setActiveTab] = useState<'STUDENT' | 'CLASS'>('STUDENT');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentReport, setStudentReport] = useState<any | null>(null);
  const [classReport, setClassReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load student list for selector
    studentsApi.getStudents({ limit: 100 }).then((res) => {
      if (res.data) {
        setStudents(res.data);
        const initial = queryStudentId || res.data[0]?._id;
        if (initial) {
          setSelectedStudentId(initial);
        }
      }
    });

    // Load default class risk report
    reportsApi.getClassRiskReport().then((res) => {
      if (res.data) {
        setClassReport(res.data);
      }
    });
  }, [queryStudentId]);

  useEffect(() => {
    if (selectedStudentId && activeTab === 'STUDENT') {
      setLoading(true);
      reportsApi.getStudentReport(selectedStudentId)
        .then((res) => {
          if (res.data) setStudentReport(res.data);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedStudentId, activeTab]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Print controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Institutional Academic & Risk Reports
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Generate standardized student evaluation transcripts and class cohort risk assessments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-md shadow-xs" role="group">
              <button
                type="button"
                onClick={() => setActiveTab('STUDENT')}
                className={`rounded-l-lg border px-3 py-1.5 text-xs font-semibold ${
                  activeTab === 'STUDENT'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Student Performance Report
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CLASS')}
                className={`rounded-r-lg border px-3 py-1.5 text-xs font-semibold ${
                  activeTab === 'CLASS'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Class Cohort Risk Report
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {/* Student Selector (no-print) */}
        {activeTab === 'STUDENT' && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs no-print flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Select Student Record:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="rounded-md border border-slate-200 p-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            >
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.studentId}) &bull; {s.department}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Printable Student Report Container */}
        {activeTab === 'STUDENT' && (
          <div>
            {loading || !studentReport ? (
              <LoadingSkeleton rows={6} />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
                {/* Institutional Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-700 text-white">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        Apex Institute of Technology & Engineering
                      </h2>
                      <p className="text-xs text-slate-600">
                        Office of Academic Evaluation & Predictive Guidance &bull; EduGuard AI
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-semibold text-slate-800">OFFICIAL STUDENT EVALUATION REPORT</p>
                    <p>Generated: {new Date(studentReport.generatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Student Demographics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                    <span className="font-bold text-slate-900 text-sm">{studentReport.student.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration ID</span>
                    <span className="font-bold font-mono text-slate-900 text-sm">{studentReport.student.studentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Department & Course</span>
                    <span className="font-semibold text-slate-800">{studentReport.student.department} ({studentReport.student.course})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Class & Semester</span>
                    <span className="font-semibold text-slate-800">Sem {studentReport.student.semester} &bull; Section {studentReport.student.section}</span>
                  </div>
                </div>

                {/* Academic Metrics Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-200 p-4 text-center">
                    <span className="text-xs text-slate-500 font-medium">Average Attendance</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {studentReport.academicSummary.averageAttendance}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 text-center">
                    <span className="text-xs text-slate-500 font-medium">Current Academic Average</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {studentReport.academicSummary.averageAcademicScore} / 100
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 text-center">
                    <span className="text-xs text-slate-500 font-medium">Model Predicted Final Score</span>
                    <p className="text-2xl font-black text-blue-700 mt-1">
                      {studentReport.aiPrediction ? `${studentReport.aiPrediction.predictedScore.toFixed(1)} / 100` : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* AI Performance & Risk Assessment */}
                {studentReport.aiPrediction && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          ANN Performance Prediction & Risk Assessment
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Engine: {studentReport.aiPrediction.modelVersion} (TensorFlow Regression)
                        </p>
                      </div>
                      <Badge variant="risk">{studentReport.aiPrediction.riskLevel}</Badge>
                    </div>

                    {/* Factors */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Potential Contributing Factors:
                      </h4>
                      {studentReport.aiPrediction.riskFactors?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No adverse risk indicators identified.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {studentReport.aiPrediction.riskFactors?.map((rf: any, i: number) => (
                            <div key={i} className="rounded bg-white p-2.5 border border-slate-200">
                              <span className="font-bold text-slate-800">{rf.factor}</span> ({rf.severity})
                              <p className="text-slate-600 text-[11px] mt-0.5">{rf.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Guidance */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Institutional Recommendations:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                        {studentReport.aiPrediction.recommendations?.map((r: string, idx: number) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Subject Performance Breakdown Table */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Subject Performance Breakdown</h3>
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Subject Code</th>
                        <th className="px-3 py-2">Subject Name</th>
                        <th className="px-3 py-2 text-center">Attendance</th>
                        <th className="px-3 py-2 text-center">Internal Marks</th>
                        <th className="px-3 py-2 text-center">Previous Score</th>
                        <th className="px-3 py-2 text-center">Study Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {studentReport.subjectPerformance.map((sub: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono font-bold">{sub.subjectCode}</td>
                          <td className="px-3 py-2">{sub.subjectName}</td>
                          <td className="px-3 py-2 text-center font-semibold">{sub.attendance}%</td>
                          <td className="px-3 py-2 text-center font-bold">{sub.internalMarks}</td>
                          <td className="px-3 py-2 text-center">{sub.previousScore}</td>
                          <td className="px-3 py-2 text-center">{sub.studyHours}h/wk</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Intervention History */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Faculty Mentorship & Intervention History</h3>
                  {studentReport.interventions && studentReport.interventions.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {studentReport.interventions.map((inv: any) => (
                        <div key={inv._id} className="rounded border border-slate-200 p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{inv.title}</span>
                            <Badge variant="status">{inv.status}</Badge>
                          </div>
                          <p className="text-slate-600">{inv.description}</p>
                          {inv.outcome && <p className="text-emerald-700 font-medium">Outcome: {inv.outcome}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No formal interventions recorded.</p>
                  )}
                </div>

                {/* Official Signatures */}
                <div className="border-t border-slate-300 pt-8 grid grid-cols-2 gap-8 text-xs text-slate-600">
                  <div>
                    <div className="border-b border-slate-400 w-48 mb-1"></div>
                    <p className="font-semibold text-slate-800">Faculty Academic Advisor</p>
                    <p className="text-[10px] text-slate-400">Department of {studentReport.student.department}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="border-b border-slate-400 w-48 mb-1"></div>
                    <p className="font-semibold text-slate-800">Dean of Academic Affairs</p>
                    <p className="text-[10px] text-slate-400">Apex Institute of Technology</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Class Cohort Risk Report */}
        {activeTab === 'CLASS' && classReport && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Class Cohort Risk Summary</h2>
                <p className="text-xs text-slate-500">Aggregate risk distribution across current academic cohort</p>
              </div>
              <span className="text-xs font-semibold text-slate-600">
                Total Evaluated: {classReport.totalStudents} Students
              </span>
            </div>

            {/* Risk Breakdown */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <span className="text-xs text-red-600 font-bold uppercase">High Risk</span>
                <p className="text-3xl font-black text-red-700 mt-1">{classReport.riskDistribution.highRisk}</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <span className="text-xs text-amber-600 font-bold uppercase">Medium Risk</span>
                <p className="text-3xl font-black text-amber-700 mt-1">{classReport.riskDistribution.mediumRisk}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <span className="text-xs text-emerald-600 font-bold uppercase">Low Risk</span>
                <p className="text-3xl font-black text-emerald-700 mt-1">{classReport.riskDistribution.lowRisk}</p>
              </div>
            </div>

            {/* Table */}
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold text-[11px]">
                <tr>
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Student Name</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2 text-center">Semester / Section</th>
                  <th className="px-3 py-2 text-center">Predicted Score</th>
                  <th className="px-3 py-2 text-center">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {classReport.students.map((s: any) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono font-bold">{s.studentId}</td>
                    <td className="px-3 py-2 font-semibold">{s.name}</td>
                    <td className="px-3 py-2">{s.department}</td>
                    <td className="px-3 py-2 text-center">Sem {s.semester}-{s.section}</td>
                    <td className="px-3 py-2 text-center font-bold">
                      {s.prediction ? `${s.prediction.predictedScore.toFixed(1)}` : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="risk">{s.prediction?.riskLevel || 'UNASSESSED'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <LoadingSkeleton rows={6} />
        </AppLayout>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
