'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { subjectsApi, programsApi, departmentsApi } from '@/lib/apiClient';
import { Award, Plus, BookOpen, AlertCircle, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SubjectsPage() {
  const { isAdmin } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 4,
    program: 'B.Tech',
    department: 'Computer Science',
    semester: 3,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const [subRes, progRes, deptRes] = await Promise.all([
        subjectsApi.getSubjects({
          program: filterProgram !== 'ALL' ? filterProgram : undefined,
          department: filterDept !== 'ALL' ? filterDept : undefined,
        }),
        programsApi.getPrograms(),
        departmentsApi.getDepartments(),
      ]);
      if (subRes.data) setSubjects(subRes.data);
      if (progRes.data) setPrograms(progRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [filterProgram, filterDept]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await subjectsApi.createSubject(formData);
      await fetchSubjects();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create subject.');
    } finally {
      setFormLoading(false);
    }
  };

  const selectedProg = programs.find((p) => p.name === formData.program);
  const maxSemesters = selectedProg?.totalSemesters || 8;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Institutional Subjects</h1>
            <p className="mt-1 text-xs text-slate-500">
              Manage department curriculum, credits, and subject course codes.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setFormError(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Subject</span>
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Program:</label>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Department:</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div key={sub._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {sub.code}
                  </span>
                  <span className="text-xs text-slate-400">{sub.credits} Credits</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{sub.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{sub.program || 'B.Tech'}</span>
                  <span>&bull;</span>
                  <span>{sub.department}</span>
                  <span>&bull;</span>
                  <span>Semester {sub.semester}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900">Add New Subject</h3>
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg">{formError}</div>
              )}
              <form onSubmit={handleCreateSubject} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS401"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Credits *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Program *</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    >
                      {programs.map((p) => (
                        <option key={p._id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    >
                      {departments
                        .filter((d) => !formData.program || d.program === formData.program || !d.program)
                        .map((d) => (
                          <option key={d._id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      {departments.length === 0 && (
                        <option value="Computer Science">Computer Science</option>
                      )}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                  >
                    {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 rounded-lg border text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : 'Add Subject'}
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
