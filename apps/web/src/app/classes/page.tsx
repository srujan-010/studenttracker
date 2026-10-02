'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { classesApi, subjectsApi, teachersApi, programsApi, departmentsApi } from '@/lib/apiClient';
import { BookOpen, Plus, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ClassesPage() {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Class Form
  const [classForm, setClassForm] = useState({
    name: '',
    program: 'B.Tech',
    department: 'Computer Science',
    academicYear: '2025-2026',
    year: 2,
    semester: 3,
    section: 'A',
  });

  // Subject Form
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    credits: 4,
    program: 'B.Tech',
    department: 'Computer Science',
    semester: 3,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clsRes, subRes, teaRes, progRes, deptRes] = await Promise.all([
        classesApi.getClasses(),
        subjectsApi.getSubjects(),
        teachersApi.getTeachers(),
        programsApi.getPrograms(),
        departmentsApi.getDepartments(),
      ]);
      if (clsRes.data) setClasses(clsRes.data);
      if (subRes.data) setSubjects(subRes.data);
      if (teaRes.data) setTeachers(teaRes.data);
      if (progRes.data) setPrograms(progRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await classesApi.createClass(classForm);
      setShowClassModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create class.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await subjectsApi.createSubject(subjectForm);
      setShowSubjectModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create subject.');
    } finally {
      setFormLoading(false);
    }
  };

  const selectedProg = programs.find((p) => p.name === classForm.program);
  const maxSemesters = selectedProg?.totalSemesters || 8;
  const maxYears = selectedProg?.durationYears || 4;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Classes & Curricular Subjects
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Institutional academic sections, enrolled branches, and credit subjects.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFormError(null);
                  setShowSubjectModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Subject</span>
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setShowClassModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Class Section</span>
              </button>
            </div>
          )}
        </div>

        {/* Classes Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Academic Classes & Sections ({classes.length})
          </h2>
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : classes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Classes Configured"
              description="No academic classes configured yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls._id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                      Sem {cls.semester}-{cls.section}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-blue-700">{cls.program || 'B.Tech'}</span>
                    <span>&bull;</span>
                    <span>{cls.department}</span>
                    <span>&bull;</span>
                    <span>Year {cls.year || Math.ceil(cls.semester / 2)}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 text-xs text-slate-600 space-y-1">
                    <p><span className="font-semibold text-slate-700">Academic Year:</span> {cls.academicYear}</p>
                    <p>
                      <span className="font-semibold text-slate-700">Assigned Faculty:</span>{' '}
                      {cls.teacherIds?.length ? cls.teacherIds.map((t: any) => t.userId?.name).join(', ') : 'None assigned'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subjects List */}
        <div className="pt-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Registered Subjects & Modules ({subjects.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Semester</th>
                  <th className="px-4 py-3 text-center">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                {subjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{sub.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{sub.name}</td>
                    <td className="px-4 py-3 font-medium text-blue-700">{sub.program || 'B.Tech'}</td>
                    <td className="px-4 py-3 text-slate-600">{sub.department}</td>
                    <td className="px-4 py-3 text-center text-slate-600">Sem {sub.semester}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">{sub.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add Academic Class Section</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-3 text-xs">
              {formError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech CSE - 3rd Sem (Sec A)"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program *</label>
                  <select
                    value={classForm.program}
                    onChange={(e) => {
                      const progName = e.target.value;
                      const p = programs.find((x) => x.name === progName);
                      setClassForm({
                        ...classForm,
                        program: progName,
                        semester: 1,
                        year: 1,
                      });
                    }}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    {programs.map((p) => (
                      <option key={p._id} value={p.name}>
                        {p.name} ({p.durationYears} Years)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={classForm.department}
                    onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    {departments
                      .filter((d) => !classForm.program || d.program === classForm.program || !d.program)
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year *</label>
                  <select
                    value={classForm.year}
                    onChange={(e) => setClassForm({ ...classForm, year: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    {Array.from({ length: maxYears }, (_, i) => i + 1).map((y) => (
                      <option key={y} value={y}>
                        {y}
                        {y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester *</label>
                  <select
                    value={classForm.semester}
                    onChange={(e) => {
                      const sem = Number(e.target.value);
                      setClassForm({
                        ...classForm,
                        semester: sem,
                        year: Math.ceil(sem / 2),
                      });
                    }}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={classForm.section}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add Subject / Module</h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-6 space-y-3 text-xs">
              {formError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS502"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                  className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program *</label>
                  <select
                    value={subjectForm.program}
                    onChange={(e) => setSubjectForm({ ...subjectForm, program: e.target.value })}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
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
                    value={subjectForm.department}
                    onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                  >
                    {departments
                      .filter((d) => !subjectForm.program || d.program === subjectForm.program || !d.program)
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={subjectForm.semester}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credits *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                    className="w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
