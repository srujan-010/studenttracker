'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  assessmentsApi,
  studentsApi,
  subjectsApi,
  programsApi,
  departmentsApi,
} from '@/lib/apiClient';
import {
  GraduationCap,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AcademicRecordsPage() {
  const { isAdmin, isTeacher } = useAuth();

  // Programs & Departments metadata
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Selection states (Item 6 in requirements)
  const [selectedProgram, setSelectedProgram] = useState('B.Tech');
  const [selectedDepartment, setSelectedDepartment] = useState('Computer Science');
  const [selectedYear, setSelectedYear] = useState<number>(2);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('Mid 1');
  const [maximumMarks, setMaximumMarks] = useState<number>(25);

  // Student rows in mark sheet
  const [students, setStudents] = useState<any[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, number | string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 1. Initial metadata loading
  useEffect(() => {
    async function loadMeta() {
      try {
        const [progRes, deptRes] = await Promise.all([
          programsApi.getPrograms(),
          departmentsApi.getDepartments(),
        ]);
        if (progRes.data && progRes.data.length > 0) {
          setPrograms(progRes.data);
          setSelectedProgram(progRes.data[0].name);
        }
        if (deptRes.data && deptRes.data.length > 0) {
          setDepartments(deptRes.data);
          const matched = deptRes.data.find((d: any) => d.program === 'B.Tech') || deptRes.data[0];
          setSelectedDepartment(matched.name);
        }
      } catch (e) {
        console.error('Failed to load initial programs metadata', e);
      }
    }
    loadMeta();
  }, []);

  // Update default maximum marks when assessment type changes
  useEffect(() => {
    if (selectedAssessment === 'Mid 1' || selectedAssessment === 'Mid 2' || selectedAssessment === 'External Lab') {
      setMaximumMarks(25);
    } else {
      setMaximumMarks(10);
    }
  }, [selectedAssessment]);

  // Update Semester when Year changes
  useEffect(() => {
    // Default semester for year: e.g. Year 2 -> Sem 3
    const newSem = (selectedYear - 1) * 2 + 1;
    setSelectedSemester(newSem);
  }, [selectedYear]);

  // Filter departments for selected program
  const filteredDepartments = departments.filter((d) => d.program === selectedProgram);

  // Find max years for selected program (4 for B.Tech, 3 for BBA/B.Sc)
  const currentProgramDoc = programs.find((p) => p.name === selectedProgram);
  const maxYears = currentProgramDoc?.durationYears || (selectedProgram === 'B.Tech' ? 4 : 3);
  const yearOptions = Array.from({ length: maxYears }, (_, i) => i + 1);

  // Semesters corresponding to selected year
  const sem1 = (selectedYear - 1) * 2 + 1;
  const sem2 = (selectedYear - 1) * 2 + 2;
  const semesterOptions = [sem1, sem2];

  // 2. Fetch Subjects when Program, Department, or Semester changes
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await subjectsApi.getSubjects({
          program: selectedProgram,
          department: selectedDepartment,
          semester: selectedSemester,
        });
        if (res.data && res.data.length > 0) {
          setSubjects(res.data);
          setSelectedSubjectId(res.data[0]._id);
        } else {
          setSubjects([]);
          setSelectedSubjectId('');
        }
      } catch (e) {
        console.error('Failed to load subjects', e);
      }
    }
    loadSubjects();
  }, [selectedProgram, selectedDepartment, selectedSemester]);

  // 3. Fetch Students and existing marks for this section & subject
  useEffect(() => {
    async function loadStudentsAndMarks() {
      if (!selectedDepartment || !selectedSemester || !selectedSection) return;

      setLoading(true);
      setMessage(null);
      try {
        // Query students in this section
        const stuRes = await studentsApi.getStudents({
          program: selectedProgram,
          department: selectedDepartment,
          semester: selectedSemester,
          section: selectedSection,
          limit: 100,
        });

        const studentList = stuRes.data || [];
        setStudents(studentList);

        // Fetch existing assessments for this subject, semester, and assessment type
        if (selectedSubjectId) {
          const assRes = await assessmentsApi.getAssessments({
            subjectId: selectedSubjectId,
            semester: selectedSemester,
          });

          const initialMarks: Record<string, number | string> = {};
          if (assRes.data) {
            assRes.data.forEach((a: any) => {
              if (a.assessmentType === selectedAssessment) {
                const sId = a.studentId?._id || a.studentId;
                initialMarks[sId] = a.obtainedMarks;
              }
            });
          }
          setMarksMap(initialMarks);
        }
      } catch (err: any) {
        setMessage({
          text: err.response?.data?.message || 'Failed to load students for mark entry.',
          isError: true,
        });
      } finally {
        setLoading(false);
      }
    }

    loadStudentsAndMarks();
  }, [
    selectedProgram,
    selectedDepartment,
    selectedSemester,
    selectedSection,
    selectedSubjectId,
    selectedAssessment,
  ]);

  const handleMarkChange = (studentId: string, val: string) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: val === '' ? '' : Number(val),
    }));
  };

  const handleSaveMarks = async () => {
    if (!selectedSubjectId) {
      setMessage({ text: 'Please select a subject before saving marks.', isError: true });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const recordsToSave = students
        .filter((s) => marksMap[s._id] !== undefined && marksMap[s._id] !== '')
        .map((s) => ({
          studentId: s._id,
          obtainedMarks: Number(marksMap[s._id]),
        }));

      if (recordsToSave.length === 0) {
        setMessage({
          text: 'No marks entered to save. Please type marks for at least one student.',
          isError: true,
        });
        setSaving(false);
        return;
      }

      await assessmentsApi.saveBatch({
        subjectId: selectedSubjectId,
        semester: selectedSemester,
        assessmentType: selectedAssessment,
        maximumMarks: Number(maximumMarks),
        records: recordsToSave,
      });

      setMessage({
        text: `Marks successfully saved for ${recordsToSave.length} students in ${selectedAssessment} (${maximumMarks} max marks).`,
        isError: false,
      });

      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'Failed to save marks.',
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Academic Records
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Select program, semester, subject, and assessment to record student marks directly into MongoDB.
          </p>
        </div>

        {/* ========================================================== */}
        {/* SELECTION BAR (Requirement 6)                              */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="h-4 w-4 text-blue-600" />
            <span>Select Academic Cohort & Subject</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Program */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedYear(1);
                  setSelectedSemester(1);
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {programs.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.durationYears} Years)
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))
                ) : (
                  <option value="Computer Science">Computer Science</option>
                )}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y === 1 ? '1st Year' : y === 2 ? '2nd Year' : y === 3 ? '3rd Year' : `${y}th Year`}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {semesterOptions.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {subjects.length > 0 ? (
                  subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))
                ) : (
                  <option value="">No subjects in this semester</option>
                )}
              </select>
            </div>

            {/* Assessment Type (6 Standard Types) */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Assessment</label>
              <select
                value={selectedAssessment}
                onChange={(e) => setSelectedAssessment(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-blue-700 bg-blue-50/50 focus:border-blue-500 focus:outline-none"
              >
                <option value="Mid 1">Mid 1 (Max 25)</option>
                <option value="Mid 2">Mid 2 (Max 25)</option>
                <option value="Internal Lab 1">Internal Lab 1 (Max 10)</option>
                <option value="Internal Lab 2">Internal Lab 2 (Max 10)</option>
                <option value="External Lab">External Lab (Max 25)</option>
                <option value="Assignment">Assignment (Max 10)</option>
              </select>
            </div>

            {/* Maximum Marks */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Maximum Marks</label>
              <input
                type="number"
                min="1"
                max="100"
                value={maximumMarks}
                onChange={(e) => setMaximumMarks(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div
            className={`rounded-xl border p-4 text-xs font-semibold flex items-center gap-2 ${
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

        {/* ========================================================== */}
        {/* STUDENT MARKS TABLE                                        */}
        {/* ========================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mark Entry &bull; {selectedAssessment}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Maximum marks: <strong className="text-slate-700">{maximumMarks}</strong> &bull; Total Students:{' '}
                <strong className="text-slate-700">{students.length}</strong>
              </p>
            </div>

            {(isAdmin || isTeacher) && students.length > 0 && (
              <button
                type="button"
                onClick={handleSaveMarks}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Marks'}</span>
              </button>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Students in Section"
              description={`No students found enrolled in ${selectedProgram} - ${selectedDepartment}, Year ${selectedYear}, Semester ${selectedSemester}, Section ${selectedSection}.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 w-44">Obtained Marks</th>
                    <th className="py-3 px-4">Max Marks</th>
                    <th className="py-3 px-4">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((stu) => {
                    const currentVal = marksMap[stu._id] !== undefined ? marksMap[stu._id] : '';
                    const numVal = Number(currentVal);
                    const pct =
                      currentVal !== '' && !isNaN(numVal) && maximumMarks > 0
                        ? Math.round((numVal / maximumMarks) * 100)
                        : null;

                    const sId = typeof stu._id === 'object' && stu._id !== null
                      ? String((stu._id as any)._id || (stu._id as any).toString())
                      : String(stu._id || stu.studentId || '');

                    return (
                      <tr key={sId || stu.studentId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {stu.studentId}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/students/${sId}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {stu.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={maximumMarks}
                              value={currentVal}
                              onChange={(e) => handleMarkChange(stu._id, e.target.value)}
                              placeholder="0"
                              className="w-24 rounded-lg border border-slate-300 p-2 text-center text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-slate-400 font-medium">/ {maximumMarks}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {maximumMarks}
                        </td>
                        <td className="py-3 px-4">
                          {pct !== null ? (
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                pct >= 70
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : pct >= 50
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Save Action */}
              {(isAdmin || isTeacher) && students.length > 0 && (
                <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Once saved, the system automatically computes student assessment performance and updates AI inputs.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveMarks}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Marks'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
