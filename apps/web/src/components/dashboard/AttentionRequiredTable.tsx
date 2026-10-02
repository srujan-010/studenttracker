'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface AttentionStudent {
  _id: string;
  studentId: string;
  name: string;
  program?: string;
  year?: number;
  yearLabel?: string;
  semester?: number;
  section?: string;
  department?: string;
  className?: string;
  predictedScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  topRiskFactor?: string;
  lastInterventionStatus?: string;
  attendance?: number;
  previousScore?: number;
}

export function AttentionRequiredTable({
  students,
}: {
  students: AttentionStudent[];
}) {
  if (!students || students.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
        No students currently requiring immediate academic attention.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            <th scope="col" className="px-5 py-3.5">Student Name</th>
            <th scope="col" className="px-5 py-3.5">Year</th>
            <th scope="col" className="px-5 py-3.5">Semester</th>
            <th scope="col" className="px-5 py-3.5 text-center">Predicted Score</th>
            <th scope="col" className="px-5 py-3.5 text-center">Risk</th>
            <th scope="col" className="px-5 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800">
          {students.map((student) => {
            const riskConfig =
              student.riskLevel === 'HIGH'
                ? { label: 'High', dot: '🔴', style: 'text-red-700 bg-red-50 border-red-200' }
                : student.riskLevel === 'MEDIUM'
                ? { label: 'Medium', dot: '🟡', style: 'text-amber-700 bg-amber-50 border-amber-200' }
                : { label: 'Low', dot: '🟢', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };

            const yearText =
              student.yearLabel ||
              (student.year ? `${student.year === 1 ? '1st' : student.year === 2 ? '2nd' : student.year === 3 ? '3rd' : `${student.year}th`} Year` : '—');

            return (
              <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                  <div className="font-bold text-slate-900">{student.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {student.studentId} &bull; {student.program || 'B.Tech'}
                  </div>
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                  {yearText}
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                  Semester {student.semester || '—'}
                </td>
                <td className="px-5 py-3.5 text-center font-bold text-slate-900 whitespace-nowrap">
                  {Math.round(student.predictedScore)} / 100
                </td>
                <td className="px-5 py-3.5 text-center whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${riskConfig.style}`}
                  >
                    <span>{riskConfig.dot}</span>
                    <span>{riskConfig.label}</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  {(() => {
                    const sId = typeof student._id === 'object' && student._id !== null
                      ? String((student._id as any)._id || (student._id as any).toString())
                      : String(student._id || student.studentId || '');

                    return (
                      <Link
                        href={`/students/${sId}`}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <span>Profile</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    );
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
