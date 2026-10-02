'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { teachersApi, classesApi, subjectsApi } from '@/lib/apiClient';
import { Briefcase, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TeachersPage() {
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: 'Computer Science',
    assignedClasses: [] as string[],
    assignedSubjects: [] as string[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teaRes, clsRes, subRes] = await Promise.all([
        teachersApi.getTeachers(),
        classesApi.getClasses(),
        subjectsApi.getSubjects(),
      ]);
      if (teaRes.data) setTeachers(teaRes.data);
      if (clsRes.data) setClasses(clsRes.data);
      if (subRes.data) setSubjects(subRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await teachersApi.createTeacher(formData);
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        department: 'Computer Science',
        assignedClasses: [],
        assignedSubjects: [],
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create teacher.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty & Teachers</h1>
            <p className="mt-1 text-xs text-slate-500">
              Institutional teaching staff and class mentorship authorizations.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setFormError(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Faculty Member</span>
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : teachers.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No Teachers Registered"
            description="No faculty members have been configured yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher._id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{teacher.userId?.name || 'Faculty'}</h3>
                    <p className="text-xs text-slate-500 font-mono">{teacher.employeeId}</p>
                    <p className="text-xs text-slate-600">{teacher.userId?.email}</p>
                  </div>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                    {teacher.department}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block">Assigned Classes:</span>
                    {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.assignedClasses.map((c: any) => (
                          <span
                            key={c._id}
                            className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 font-medium"
                          >
                            {c.name || `${c.department} Sem ${c.semester}-${c.section}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No classes assigned</span>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block">Subjects Taught:</span>
                    {teacher.assignedSubjects && teacher.assignedSubjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.assignedSubjects.map((s: any) => (
                          <span
                            key={s._id}
                            className="rounded bg-purple-50 px-2 py-0.5 text-[11px] text-purple-700 font-medium"
                          >
                            {s.code}: {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No subjects assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add Faculty Member</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTeacher} className="p-6 space-y-3 text-xs">
              {formError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-CS-104"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                  className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Rao"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@institution.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                </select>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Register Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
