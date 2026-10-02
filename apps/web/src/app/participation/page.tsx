'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { participationApi, classesApi, subjectsApi } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  Activity,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
} from 'lucide-react';

export default function ParticipationPage() {
  const { user, isTeacher, isAdmin } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [studentsSheet, setStudentsSheet] = useState<
    {
      studentId: string;
      studentNumber: string;
      studentName: string;
      department: string;
      section: string;
      semester: number;
      obtainedScore: number;
      maximumScore: number;
      notes?: string;
    }[]
  >([]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, subRes] = await Promise.all([
          classesApi.getClasses(),
          subjectsApi.getSubjects(),
        ]);
        if (clsRes.data && clsRes.data.length > 0) {
          setClasses(clsRes.data);
          setSelectedClassId(clsRes.data[0]._id);
        }
        if (subRes.data && subRes.data.length > 0) {
          setSubjects(subRes.data);
          setSelectedSubjectId(subRes.data[0]._id);
        }
      } catch (e: any) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    async function loadSheet() {
      setLoading(true);
      setMessage(null);
      try {
        const res = await participationApi.getSheet(selectedClassId, selectedDate, selectedSubjectId);
        if (res.data?.students) {
          setStudentsSheet(res.data.students);
        }
      } catch (err: any) {
        setMessage({
          text: err.response?.data?.message || 'Failed to load participation sheet.',
          isError: true,
        });
      } finally {
        setLoading(false);
      }
    }
    loadSheet();
  }, [selectedClassId, selectedSubjectId, selectedDate]);

  const handleScoreChange = (studentId: string, score: number) => {
    setStudentsSheet((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, obtainedScore: score } : s))
    );
  };

  const handleSaveBatch = async () => {
    if (!selectedSubjectId) {
      setMessage({ text: 'Please select a subject.', isError: true });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const records = studentsSheet.map((s) => ({
        studentId: s.studentId,
        obtainedScore: s.obtainedScore,
        maximumScore: s.maximumScore || 5,
        notes: s.notes,
      }));

      await participationApi.saveBatch({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: selectedDate,
        records,
      });

      setMessage({
        text: `Participation scores saved for ${records.length} students on ${selectedDate}. Stored in MongoDB.`,
        isError: false,
      });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Failed to save participation scores.',
        isError: true,
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const totalObtained = studentsSheet.reduce((sum, s) => sum + (Number(s.obtainedScore) || 0), 0);
  const totalMax = studentsSheet.reduce((sum, s) => sum + (Number(s.maximumScore) || 5), 0);
  const avgPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Classroom Participation Scores
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Evaluate discussion, Q&amp;A engagement, and collaborative participation points.
            </p>
          </div>

          <button
            onClick={handleSaveBatch}
            disabled={saving || studentsSheet.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving to MongoDB...' : 'Save Scores'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Class Section *</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.department} - Sec {c.section})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {studentsSheet.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Students Enrolled: <strong className="text-slate-900">{studentsSheet.length}</strong>
              </span>
              <span className="font-semibold text-blue-700">
                Average Participation: {avgPct}% ({totalObtained} / {totalMax} points)
              </span>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center gap-2 ${
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

        {/* Student Score Sheet */}
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : studentsSheet.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No students found in this class section.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <span>Student</span>
              <span>Participation Score (0–5 Points)</span>
            </div>

            <div className="divide-y divide-slate-100">
              {studentsSheet.map((s) => (
                <div
                  key={s.studentId}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{s.studentName}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {s.studentNumber} &bull; Sem {s.semester} (Sec {s.section})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3, 4, 5].map((pts) => {
                        const isSelected = s.obtainedScore === pts;
                        return (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => handleScoreChange(s.studentId, pts)}
                            className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {pts}
                          </button>
                        );
                      })}
                      <span className="text-xs text-slate-400 font-medium ml-1">/ 5 pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
