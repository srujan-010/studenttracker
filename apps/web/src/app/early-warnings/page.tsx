'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { InterventionModal } from '@/components/students/InterventionModal';
import { studentsApi } from '@/lib/apiClient';
import { StudentDTO } from '@eduguard/shared';
import {
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function EarlyWarningsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState<StudentDTO | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentsApi.getStudents({ limit: 250 });
      if (res.data) {
        setStudents(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students per risk category
  const highRiskStudents = students.filter(
    (s) => s.latestPrediction?.riskLevel === 'HIGH'
  );
  const mediumRiskStudents = students.filter(
    (s) => s.latestPrediction?.riskLevel === 'MEDIUM'
  );
  const lowRiskStudents = students.filter(
    (s) => s.latestPrediction?.riskLevel === 'LOW'
  );

  const activeCohort =
    activeTab === 'HIGH'
      ? highRiskStudents
      : activeTab === 'MEDIUM'
      ? mediumRiskStudents
      : lowRiskStudents;

  // Format main attention areas into simple bullet points (Section 13)
  const getAttentionAreas = (student: StudentDTO) => {
    const factors = student.latestPrediction?.riskFactors || [];
    if (factors.length === 0) {
      return ['No critical risk factors identified'];
    }

    return factors.map((rf: any) => {
      const f = rf.factor.toLowerCase();
      if (f.includes('attendance')) return 'Low attendance';
      if (f.includes('previous')) return 'Low previous marks';
      if (f.includes('internal')) return 'Low internal assessment marks';
      if (f.includes('assignment')) return 'Low assignment completion';
      if (f.includes('study')) return 'Low self-study hours';
      if (f.includes('participation')) return 'Low class participation';
      return rf.factor;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header (Section 13) */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Early Warnings
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Students who may need additional academic support.
          </p>
        </div>

        {/* 3 Simple Risk Category Tabs (Section 13) */}
        <div className="flex border-b border-slate-200 space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('HIGH')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'HIGH'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🔴</span>
            <span>High Risk ({highRiskStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MEDIUM')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'MEDIUM'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🟡</span>
            <span>Medium Risk ({mediumRiskStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOW')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'LOW'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🟢</span>
            <span>Low Risk ({lowRiskStudents.length})</span>
          </button>
        </div>

        {/* Students List */}
        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : activeCohort.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={`No ${activeTab.toLowerCase()} risk students`}
            description={`There are currently no students classified under ${activeTab.toLowerCase()} risk.`}
          />
        ) : (
          <div className="space-y-3">
            {activeCohort.map((student) => {
              const pred = student.latestPrediction;
              const attentionAreas = getAttentionAreas(student);

              return (
                <div
                  key={student._id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                      <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {student.studentId}
                      </span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {student.program || student.course || 'B.Tech'}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        &bull; {student.department} &bull; {student.year ? `${student.year === 1 ? '1st' : student.year === 2 ? '2nd' : student.year === 3 ? '3rd' : `${student.year}th`} Year` : 'Year —'} &bull; Sem {student.semester}-{student.section}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 font-medium">Predicted Score:</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {pred ? Math.round(pred.predictedScore) : '—'} / 100
                        </span>
                      </div>
                      <span className="text-slate-300">&bull;</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          student.latestPrediction?.riskLevel === 'HIGH'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : student.latestPrediction?.riskLevel === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span>
                          {student.latestPrediction?.riskLevel === 'HIGH'
                            ? '🔴'
                            : student.latestPrediction?.riskLevel === 'MEDIUM'
                            ? '🟡'
                            : '🟢'}
                        </span>
                        <span>{student.latestPrediction?.riskLevel} RISK</span>
                      </span>
                    </div>

                    {/* Main Attention Areas */}
                    <div className="pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Main Attention Areas:
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs text-slate-700">
                        {attentionAreas.map((area, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="text-slate-400">•</span>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions (Requirement 19) */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                    {(() => {
                      const sId = typeof student._id === 'object' && student._id !== null
                        ? String((student._id as any)._id || (student._id as any).toString())
                        : String(student._id || student.studentId || '');

                      return (
                        <Link
                          href={`/students/${sId}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
                        >
                          <span>View Profile</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      );
                    })()}

                    {(isAdmin || isTeacher) && (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForIntervention(student)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Add Intervention</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Intervention Modal */}
      {selectedStudentForIntervention && (
        <InterventionModal
          studentId={selectedStudentForIntervention._id}
          studentName={selectedStudentForIntervention.name}
          predictionId={selectedStudentForIntervention.latestPrediction?._id}
          onSuccess={() => {
            fetchStudents();
            setSelectedStudentForIntervention(null);
          }}
          onClose={() => setSelectedStudentForIntervention(null)}
        />
      )}
    </AppLayout>
  );
}
