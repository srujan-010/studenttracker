'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { interventionsApi, studentsApi } from '@/lib/apiClient';
import { InterventionDTO, InterventionStatus } from '@eduguard/shared';
import {
  CheckSquare,
  PlusCircle,
  X,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function InterventionsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [interventions, setInterventions] = useState<InterventionDTO[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add Intervention Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    studentId: '',
    type: 'ACADEMIC_COUNSELING',
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  // Edit Status Modal State
  const [editingInv, setEditingInv] = useState<InterventionDTO | null>(null);
  const [editStatus, setEditStatus] = useState<InterventionStatus>('IN_PROGRESS');
  const [editOutcome, setEditOutcome] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, stuRes] = await Promise.all([
        interventionsApi.getInterventions({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          limit: 100,
        }),
        studentsApi.getStudents({ limit: 100 }),
      ]);
      if (invRes.data) setInterventions(invRes.data);
      if (stuRes.data) setStudents(stuRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.studentId || !addForm.title || !addForm.description || !addForm.dueDate) {
      setAddError('Please fill all required intervention details.');
      return;
    }

    setAddLoading(true);
    setAddError(null);
    try {
      await interventionsApi.createIntervention({
        studentId: addForm.studentId,
        type: addForm.type as any,
        title: addForm.title,
        description: addForm.description,
        priority: addForm.priority as any,
        dueDate: addForm.dueDate,
      });
      setShowAddModal(false);
      setAddForm({
        studentId: '',
        type: 'ACADEMIC_COUNSELING',
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      fetchData();
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Failed to create intervention.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInv) return;

    setEditLoading(true);
    try {
      await interventionsApi.updateIntervention(editingInv._id, {
        status: editStatus,
        outcome: editOutcome,
        notes: editNotes,
      });
      setEditingInv(null);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setEditLoading(false);
    }
  };

  const getFriendlyType = (t: string) => {
    switch (t) {
      case 'ACADEMIC_COUNSELING': return 'Academic Counseling';
      case 'ATTENDANCE_FOLLOWUP': return 'Attendance Support';
      case 'ASSIGNMENT_FOLLOWUP': return 'Assignment Support';
      case 'STUDY_PLANNING': return 'Study Planning';
      case 'REMEDIAL_SUPPORT': return 'Remedial Support';
      default: return 'Other';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Interventions
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Track academic support and counseling actions for students.
            </p>
          </div>
          {(isAdmin || isTeacher) && (
            <button
              onClick={() => {
                setAddError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Intervention</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter by Status:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s === 'OPEN' ? 'Open' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {/* Section 14: Intervention History */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900">
            Intervention History
          </h3>

          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : interventions.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No Interventions Found"
              description="No academic support initiatives currently logged."
              actionText={isAdmin || isTeacher ? 'Add Intervention' : undefined}
              onAction={isAdmin || isTeacher ? () => setShowAddModal(true) : undefined}
            />
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              {interventions.map((inv) => {
                const statusStyle =
                  inv.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : inv.status === 'IN_PROGRESS'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200';

                return (
                  <div key={inv._id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{inv.title}</h4>
                          <span className="text-xs text-slate-400 font-medium">&bull;</span>
                          <span className="text-xs font-semibold text-blue-700">
                            {getFriendlyType(inv.type)}
                          </span>
                        </div>
                        {(() => {
                          const sObj = (typeof inv.studentId === 'object' && inv.studentId !== null ? inv.studentId : (inv as any).student) || {};
                          const sId = sObj._id ? String(sObj._id) : (sObj.studentId || (typeof inv.studentId === 'string' ? inv.studentId : ''));
                          const sName = sObj.name || (inv as any).studentName || 'Student';
                          const sCode = sObj.studentId || '';

                          return (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Student:{' '}
                              {sId ? (
                                <Link
                                  href={`/students/${sId}`}
                                  className="font-semibold text-slate-800 hover:text-blue-600"
                                >
                                  {sName} {sCode ? `(${sCode})` : ''}
                                </Link>
                              ) : (
                                <span className="font-semibold text-slate-800">
                                  {sName} {sCode ? `(${sCode})` : ''}
                                </span>
                              )}
                              {inv.dueDate && (
                                <span className="ml-2 text-slate-400">
                                  &bull; Due: {new Date(inv.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusStyle}`}>
                          Status: {inv.status === 'IN_PROGRESS' ? 'In Progress' : inv.status === 'OPEN' ? 'Open' : 'Completed'}
                        </span>
                        {(isAdmin || isTeacher) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInv(inv);
                              setEditStatus(inv.status);
                              setEditOutcome(inv.outcome || '');
                              setEditNotes(inv.notes || '');
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Update</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-600">{inv.description}</p>

                    {inv.outcome && (
                      <div className="mt-2 rounded-lg bg-emerald-50/70 border border-emerald-200 p-2 text-xs text-emerald-800">
                        <strong>Outcome Recorded:</strong> {inv.outcome}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Intervention Modal (Section 14) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add Academic Intervention</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              {addError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student *</label>
                <select
                  required
                  value={addForm.studentId}
                  onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.studentId}) &bull; Sem {s.semester}-{s.section}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Intervention Type *</label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ACADEMIC_COUNSELING">Academic Counseling</option>
                    <option value="ATTENDANCE_FOLLOWUP">Attendance Support</option>
                    <option value="ASSIGNMENT_FOLLOWUP">Assignment Support</option>
                    <option value="STUDY_PLANNING">Study Planning</option>
                    <option value="REMEDIAL_SUPPORT">Remedial Support</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={addForm.priority}
                    onChange={(e) => setAddForm({ ...addForm, priority: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intervention Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remedial Algebra & Calculus Mentoring"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Due Date *</label>
                <input
                  type="date"
                  required
                  value={addForm.dueDate}
                  onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe proposed faculty counseling, attendance milestone, or homework review plan..."
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {addLoading ? 'Saving...' : 'Save Intervention'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Update Intervention Status</h3>
              <button onClick={() => setEditingInv(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as InterventionStatus)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Outcome & Notes
                </label>
                <textarea
                  rows={3}
                  value={editOutcome}
                  onChange={(e) => setEditOutcome(e.target.value)}
                  placeholder="Document the outcome of counseling session, student response, or improvement..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInv(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
