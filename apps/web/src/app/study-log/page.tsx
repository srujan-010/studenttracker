'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { studyLogsApi, subjectsApi } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

export default function StudyLogPage() {
  const { user, isStudent } = useAuth();

  const [logs, setLogs] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 2,
    topicsCovered: '',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, subRes] = await Promise.all([
        studyLogsApi.getStudyLogs(),
        subjectsApi.getSubjects(),
      ]);

      if (logsRes.data) {
        setLogs(logsRes.data);
        if ((logsRes as any).stats?.totalHours) setTotalHours((logsRes as any).stats.totalHours);
        else {
          const sum = logsRes.data.reduce((acc: number, l: any) => acc + (l.hours || 0), 0);
          setTotalHours(Math.round(sum * 10) / 10);
        }
      }
      if (subRes.data) {
        const subList = subRes.data;
        setSubjects(subList);
        if (subList.length > 0) setFormData((prev) => ({ ...prev, subjectId: subList[0]._id }));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.hours) <= 0) {
      setFormError('Study hours must be greater than zero.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await studyLogsApi.createStudyLog(formData);
      setFormSuccess('Study session logged successfully in MongoDB.');
      await fetchData();

      setTimeout(() => {
        setShowModal(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to record study log.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study log entry?')) return;
    try {
      await studyLogsApi.deleteStudyLog(id);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete study log.');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Personal Study Log
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Log daily self-study hours. Your weekly study commitment is calculated from these records.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setFormSuccess(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Study Hours</span>
          </button>
        </div>

        {/* Weekly Stats Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 border border-blue-100">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Calculated Study Commitment
              </span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {totalHours} <span className="text-sm font-normal text-slate-400">hrs/week</span>
              </p>
              <p className="text-xs text-slate-500">
                Based on {logs.length} logged self-study sessions.
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right text-xs text-slate-400">
            <p>Target guideline:</p>
            <strong className="text-slate-700 font-semibold">&gt; 8 hours / week</strong>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Study Logs Recorded"
            description="Start logging your daily self-study hours to track your academic study habits."
            actionText="Log First Session"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-5 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Subject</th>
                  <th scope="col" className="px-3 py-3 text-center">Hours Studied</th>
                  <th scope="col" className="px-5 py-3">Topics Covered & Notes</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-900">
                      {new Date(log.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">
                        {log.subjectId?.name || 'General Self Study'}
                      </span>
                      {log.subjectId?.code && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {log.subjectId?.code}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                        {log.hours} {log.hours === 1 ? 'hour' : 'hours'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600">
                      <p className="font-medium text-slate-900">{log.topicsCovered || '—'}</p>
                      {log.notes && <p className="text-[11px] text-slate-400 mt-0.5">{log.notes}</p>}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log._id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Log Entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Log Study Hours */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h3 className="text-base font-bold text-slate-900">Log Self-Study Session</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record study hours completed today or for a prior date.
                </p>
              </div>

              <form onSubmit={handleCreateLog} className="p-6 space-y-4 text-xs">
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">General Academic Study</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hours Studied *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      required
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Topics Covered</label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 4 Practice Problems, Graph Traversal"
                    value={formData.topicsCovered}
                    onChange={(e) => setFormData({ ...formData, topicsCovered: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notes / Reflection</label>
                  <textarea
                    rows={2}
                    placeholder="Key concepts reviewed or difficulties encountered..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : 'Save Study Log'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
