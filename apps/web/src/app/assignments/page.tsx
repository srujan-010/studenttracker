'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { assignmentsApi, subjectsApi, classesApi } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Check,
  X,
  Upload,
} from 'lucide-react';

export default function AssignmentsPage() {
  const { user, isTeacher, isAdmin, isStudent } = useAuth();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected assignment for submissions view (Teacher)
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    classId: '',
    description: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    maximumMarks: 25,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, subRes, clsRes] = await Promise.all([
        assignmentsApi.getAssignments(),
        subjectsApi.getSubjects(),
        classesApi.getClasses(),
      ]);

      if (assignRes.data) setAssignments(assignRes.data);
      if (subRes.data) {
        const subList = subRes.data;
        setSubjects(subList);
        if (subList.length > 0) setFormData((prev) => ({ ...prev, subjectId: subList[0]._id }));
      }
      if (clsRes.data) {
        const clsList = clsRes.data;
        setClasses(clsList);
        if (clsList.length > 0) setFormData((prev) => ({ ...prev, classId: clsList[0]._id }));
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

  const handleOpenSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubsLoading(true);
    try {
      const res = await assignmentsApi.getSubmissions(assignment._id);
      if (res.data) setSubmissions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleUpdateStudentStatus = async (
    studentId: string,
    newStatus: 'SUBMITTED' | 'NOT_SUBMITTED' | 'LATE'
  ) => {
    if (!selectedAssignment) return;
    try {
      await assignmentsApi.updateSubmissionStatus({
        assignmentId: selectedAssignment._id,
        studentId,
        status: newStatus,
      });

      // Refresh list
      const res = await assignmentsApi.getSubmissions(selectedAssignment._id);
      if (res.data) setSubmissions(res.data);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update submission status.');
    }
  };

  const handleStudentSubmit = async (assignmentId: string) => {
    try {
      await assignmentsApi.submitMyAssignment(assignmentId, {
        notes: 'Submitted on portal by student.',
      });
      await fetchData();
      alert('Assignment submitted successfully!');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to submit assignment.');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subjectId || !formData.dueDate) {
      setFormError('Please fill in title, subject, and due date.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await assignmentsApi.createAssignment(formData);
      setFormSuccess('Assignment created and assigned in MongoDB.');
      await fetchData();

      setTimeout(() => {
        setShowCreateModal(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isStudent ? 'My Coursework Assignments' : 'Assignments & Submissions'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {isStudent
                ? 'Track your pending and submitted coursework assignments.'
                : 'Create assignments and manage student submission statuses.'}
            </p>
          </div>

          {(isAdmin || isTeacher) && (
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Assignment</span>
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Assignments Available"
            description="No coursework assignments have been posted yet."
            actionText={isAdmin || isTeacher ? 'Create Assignment' : undefined}
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((a) => {
              const dueDate = new Date(a.dueDate);
              const isPastDue = new Date() > dueDate;
              const subStatus = a.submissionStatus;

              return (
                <div
                  key={a._id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                        {a.subjectId?.name || 'Subject'} ({a.subjectId?.code})
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {a.maximumMarks} pts
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
                    {a.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{a.description}</p>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Due: {dueDate.toLocaleDateString()}</span>
                      {isPastDue && <span className="text-red-600 font-semibold">(Past Due)</span>}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                    {isStudent ? (
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            subStatus === 'SUBMITTED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : subStatus === 'LATE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {subStatus === 'SUBMITTED' && <Check className="h-3 w-3" />}
                          <span>{subStatus ? subStatus.replace('_', ' ') : 'NOT SUBMITTED'}</span>
                        </span>

                        {subStatus !== 'SUBMITTED' && (
                          <button
                            onClick={() => handleStudentSubmit(a._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Submit</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenSubmissions(a)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        <span>Manage Submissions</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Submissions List for Teacher */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedAssignment.title} &bull; Submissions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()} &bull; Max Marks: {selectedAssignment.maximumMarks}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3">
                {subsLoading ? (
                  <LoadingSkeleton rows={4} />
                ) : submissions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No student submissions tracked for this assignment yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {submissions.map((sub) => {
                      const isSubmitted = sub.status === 'SUBMITTED' || sub.status === 'GRADED';

                      return (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {sub.studentId?.name || 'Student'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {sub.studentId?.studentId} &bull; Sem {sub.studentId?.semester}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                isSubmitted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {sub.status.replace('_', ' ')}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStudentStatus(
                                  sub.studentId?._id || sub.studentId,
                                  isSubmitted ? 'NOT_SUBMITTED' : 'SUBMITTED'
                                )
                              }
                              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              Toggle Status
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Assignment */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h3 className="text-base font-bold text-slate-900">Create Coursework Assignment</h3>
              </div>

              <form onSubmit={handleCreateAssignment} className="p-6 space-y-4 text-xs">
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
                  <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assignment 3: Dynamic Programming"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                    <select
                      required
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
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
                    <label className="block font-semibold text-slate-700 mb-1">Class Section</label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Maximum Marks *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.maximumMarks}
                      onChange={(e) => setFormData({ ...formData, maximumMarks: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Instructions and assignment specifications..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formLoading ? 'Creating...' : 'Create Assignment'}
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
