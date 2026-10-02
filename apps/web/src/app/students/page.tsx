'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { studentsApi, programsApi, departmentsApi } from '@/lib/apiClient';
import { StudentDTO } from '@eduguard/shared';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  X,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function StudentsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Metadata
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Filters (Requirement 18)
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    phone: '',
    program: 'B.Tech',
    department: 'Computer Science',
    year: 2,
    semester: 3,
    section: 'A',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load programs & departments metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const [progRes, deptRes] = await Promise.all([
          programsApi.getPrograms(),
          departmentsApi.getDepartments(),
        ]);
        if (progRes.data) setPrograms(progRes.data);
        if (deptRes.data) setDepartments(deptRes.data);
      } catch (e) {
        console.error('Failed to load metadata', e);
      }
    }
    loadMeta();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentsApi.getStudents({
        search: search.trim() || undefined,
        program: programFilter === 'ALL' ? undefined : programFilter,
        department: departmentFilter === 'ALL' ? undefined : departmentFilter,
        year: yearFilter === 'ALL' ? undefined : yearFilter,
        semester: semesterFilter === 'ALL' ? undefined : semesterFilter,
        section: sectionFilter === 'ALL' ? undefined : sectionFilter,
        riskLevel: riskFilter === 'ALL' ? undefined : riskFilter,
        page,
        limit: 15,
      });
      if (res.data) {
        setStudents(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalCount(res.meta.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, programFilter, departmentFilter, yearFilter, semesterFilter, sectionFilter, riskFilter, page]);

  // Determine allowed years based on program
  const currentProgDoc = programs.find((p) => p.name === programFilter);
  const maxYears = currentProgDoc?.durationYears || (programFilter === 'B.Tech' ? 4 : programFilter === 'ALL' ? 4 : 3);
  const yearOptions = Array.from({ length: maxYears }, (_, i) => i + 1);

  // Filtered departments for program
  const availableDepts = programFilter === 'ALL' ? departments : departments.filter((d) => d.program === programFilter);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await studentsApi.createStudent({
        ...formData,
        course: formData.program,
      });
      setShowAddModal(false);
      setFormData({
        studentId: '',
        name: '',
        email: '',
        phone: '',
        program: 'B.Tech',
        department: 'Computer Science',
        year: 2,
        semester: 3,
        section: 'A',
      });
      fetchStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create student.');
    } finally {
      setFormLoading(false);
    }
  };

  // Dependent semesters based on selected year
  const semOptions =
    yearFilter !== 'ALL'
      ? [Number(yearFilter) * 2 - 1, Number(yearFilter) * 2]
      : Array.from({ length: maxYears * 2 }, (_, i) => i + 1);

  const clearFilters = () => {
    setSearch('');
    setProgramFilter('ALL');
    setDepartmentFilter('ALL');
    setYearFilter('ALL');
    setSemesterFilter('ALL');
    setSectionFilter('ALL');
    setRiskFilter('ALL');
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* DEMO DATA Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-center justify-between text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong className="font-semibold">DEMO DATA MODE:</strong> Student records, attendance, and assessment grades are synthetic demo data created for college multi-program testing.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-200/60 rounded text-blue-900">
            120+ Students Enrolled
          </span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Enrolled Students ({totalCount})
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              College directory across B.Tech, BBA, and B.Sc degree programs.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Student</span>
            </button>
          )}
        </div>

        {/* ========================================================== */}
        {/* MULTI-CRITERIA FILTERS BAR (Requirements 16 & 17)          */}
        {/* Search | Program | Department | Year | Semester | Section | Risk */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-blue-600" />
              <span>Filter Student Cohort</span>
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
            {/* Search */}
            <div className="sm:col-span-2 relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or ID..."
                className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Program Filter */}
            <div>
              <select
                value={programFilter}
                onChange={(e) => {
                  setProgramFilter(e.target.value);
                  setYearFilter('ALL');
                  setSemesterFilter('ALL');
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="ALL">All Programs</option>
                {programs.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name} ({p.durationYears} Yrs)
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Depts</option>
                {availableDepts.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <select
                value={yearFilter}
                onChange={(e) => {
                  const y = e.target.value;
                  setYearFilter(y);
                  setSemesterFilter('ALL');
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="ALL">All Years</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y === 1 ? '1st Year' : y === 2 ? '2nd Year' : y === 3 ? '3rd Year' : `${y}th Year`}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Filter (Dependent on Year) */}
            <div>
              <select
                value={semesterFilter}
                onChange={(e) => {
                  setSemesterFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Semesters</option>
                {semOptions.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter (Requirement 16) */}
            <div>
              <select
                value={sectionFilter}
                onChange={(e) => {
                  setSectionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="ALL">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            {/* Risk Filter */}
            <div>
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">🔴 High Risk</option>
                <option value="MEDIUM">🟡 Medium Risk</option>
                <option value="LOW">🟢 Low Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* STUDENTS TABLE                                             */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Enrolled Students ({totalCount})
            </h3>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
          </div>

          {loading ? (
            <LoadingSkeleton rows={6} />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Students Found"
              description="No students match the selected filter criteria. Try adjusting or clearing your filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Program & Dept</th>
                    <th className="py-3 px-4">Cohort</th>
                    <th className="py-3 px-4 text-center">Score Estimate</th>
                    <th className="py-3 px-4 text-center">Risk Level</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((stu) => {
                    const latest = stu.latestPrediction;
                    const score = latest ? Math.round(latest.predictedScore) : null;
                    const risk = latest?.riskLevel;
                    const sId = typeof stu._id === 'object' && stu._id !== null
                      ? String((stu._id as any)._id || (stu._id as any).toString())
                      : String(stu._id || stu.studentId || '');

                    return (
                      <tr key={sId || stu.studentId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Link
                            href={`/students/${sId}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {stu.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {stu.studentId}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {stu.program || stu.course || 'B.Tech'}
                          </span>
                          <div className="text-[11px] text-slate-500">{stu.department}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          <span>{stu.year} Year &bull; Sem {stu.semester}</span>
                          <span className="ml-1 text-slate-400 font-mono">(Sec {stu.section})</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900 whitespace-nowrap">
                          {score !== null ? `${score} / 100` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {risk === 'HIGH' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              <span>🔴</span>
                              <span>High</span>
                            </span>
                          ) : risk === 'MEDIUM' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>🟡</span>
                              <span>Medium</span>
                            </span>
                          ) : risk === 'LOW' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>🟢</span>
                              <span>Low</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unrated</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/students/${sId}`}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <span>Profile</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Showing page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Student</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Student ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU2026099"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="student@eduguard.demo"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Program</label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="BBA">BBA</option>
                    <option value="B.Sc">B.Sc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Comm</option>
                    <option value="Business Administration">Business Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  >
                    <option value={1}>1st</option>
                    <option value={2}>2nd</option>
                    <option value={3}>3rd</option>
                    <option value={4}>4th</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {formLoading ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
