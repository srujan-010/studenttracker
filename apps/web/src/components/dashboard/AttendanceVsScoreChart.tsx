'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from 'recharts';

interface ScatterItem {
  studentName: string;
  studentId?: string;
  attendance: number;
  predictedScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function AttendanceVsScoreChart({ data }: { data: ScatterItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-xs text-slate-400">
        No attendance correlation points available.
      </div>
    );
  }

  const getColor = (risk: string) => {
    if (risk === 'HIGH') return '#ef4444';
    if (risk === 'MEDIUM') return '#f59e0b';
    return '#10b981';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ScatterItem;
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md text-xs">
          <p className="font-bold text-slate-800">{item.studentName}</p>
          <p className="text-slate-500 font-mono text-[10px]">{item.studentId}</p>
          <div className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1.5">
            <p className="text-slate-600">
              Attendance: <span className="font-semibold text-slate-900">{item.attendance}%</span>
            </p>
            <p className="text-slate-600">
              Predicted Score: <span className="font-semibold text-slate-900">{item.predictedScore}</span>
            </p>
            <p className="text-slate-600">
              Risk Category: <span className="font-bold" style={{ color: getColor(item.riskLevel) }}>{item.riskLevel}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 15, right: 20, bottom: 15, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number"
            dataKey="attendance"
            name="Attendance"
            unit="%"
            domain={[0, 100]}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            type="number"
            dataKey="predictedScore"
            name="Predicted Score"
            domain={[0, 100]}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Students" data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.riskLevel)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
