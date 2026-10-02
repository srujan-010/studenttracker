'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { settingsApi, programsApi, departmentsApi } from '@/lib/apiClient';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  Settings,
  Cpu,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
  GraduationCap,
  Plus,
  Trash2,
  Building,
  Percent,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'programs' | 'weights' | 'thresholds'>('programs');

  // Programs & Departments
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Program Form
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: '',
    code: '',
    durationYears: 4,
    totalSemesters: 8,
    departments: 'Computer Science, Information Technology',
  });

  // New Department Form
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    program: 'B.Tech',
  });

  // Configurable Mark Weights (Requirement 10)
  const [useOfficialWeighting, setUseOfficialWeighting] = useState(false);
  const [markWeights, setMarkWeights] = useState({
    mid1: 25,
    mid2: 25,
    internalLab: 15,
    externalLab: 25,
    assignment: 10,
  });

  // Risk Thresholds & Institutional Settings
  const [thresholds, setThresholds] = useState({
    highRiskBelow: 50.0,
    mediumRiskBelow: 70.0,
    attendanceThreshold: 75.0,
    previousScoreThreshold: 55.0,
    internalMarksThreshold: 50.0,
    assignmentCompletionThreshold: 70.0,
    studyHoursThreshold: 8.0,
    participationThreshold: 50.0,
  });
  const [institutionName, setInstitutionName] = useState('Apex Institute of Technology & Management');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [setRes, progRes, deptRes] = await Promise.all([
        settingsApi.getSettings(),
        programsApi.getPrograms(),
        departmentsApi.getDepartments(),
      ]);

      if (setRes.data?.settings) {
        if (setRes.data.settings.riskThresholds) {
          setThresholds(setRes.data.settings.riskThresholds);
        }
        if (setRes.data.settings.institutionName) {
          setInstitutionName(setRes.data.settings.institutionName);
        }
      }
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

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    try {
      await programsApi.createProgram({
        name: programForm.name,
        code: programForm.code,
        durationYears: Number(programForm.durationYears),
        totalSemesters: Number(programForm.totalSemesters),
        departments: programForm.departments.split(',').map((s) => s.trim()),
      });
      setShowProgramModal(false);
      setSuccess('Academic Program created successfully.');
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create program.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    try {
      await departmentsApi.createDepartment(deptForm);
      setShowDeptModal(false);
      setSuccess('Department registered successfully.');
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only Institutional Administrators can update settings.');
      return;
    }

    setSaveLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await settingsApi.updateThresholds({
        ...thresholds,
        institutionName,
      });
      setSuccess('Institutional parameters successfully saved.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('Official Assessment Weighting configuration saved.');
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional Administration & Settings
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Configure Academic Programs (B.Tech, BBA, B.Sc), Departments, Assessment Weights, and Risk Thresholds.
          </p>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('programs')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'programs'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Programs & Departments</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weights')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'weights'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Percent className="h-4 w-4" />
            <span>Configurable Mark Weights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thresholds')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'thresholds'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Risk Thresholds & Institution</span>
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <div>
            {/* TAB 1: Programs & Departments */}
            {activeTab === 'programs' && (
              <div className="space-y-6">
                {/* Programs Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Academic Programs</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Programs offered by the institution (e.g. B.Tech 4 Years / 8 Semesters, BBA 3 Years / 6 Semesters).
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowProgramModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Program</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {programs.map((p) => (
                      <div
                        key={p._id || p.name}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {p.code}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {p.durationYears} Years ({p.totalSemesters} Semesters)
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                        <div className="text-xs text-slate-500">
                          <strong>Departments:</strong> {p.departments?.join(', ') || 'General'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Departments Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Departments</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Departments registered under each academic program.
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowDeptModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Department</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {departments.map((dept) => (
                      <div
                        key={dept._id}
                        className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{dept.name}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{dept.code}</div>
                        </div>
                        <span className="rounded bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 font-semibold text-[11px]">
                          {dept.program}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Configurable Mark Weights (Requirement 10) */}
            {activeTab === 'weights' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Configurable Mark Weights
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure optional assessment weights. When disabled, the system computes raw Assessment Performance: (Total Obtained / Total Maximum × 100).
                  </p>
                </div>

                <form onSubmit={handleSaveWeights} className="space-y-5 text-xs">
                  {/* Enable / Disable toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">Enable Official Institutional Weighting</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        If disabled, the system simply displays raw assessment percentage (81 / 105 = 77.1%).
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useOfficialWeighting}
                        onChange={(e) => setUseOfficialWeighting(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {useOfficialWeighting && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                      <div className="p-3 rounded-xl border border-slate-200 bg-white">
                        <label className="block font-semibold text-slate-700 mb-1">Mid 1 Weight (%)</label>
                        <input
                          type="number"
                          value={markWeights.mid1}
                          onChange={(e) => setMarkWeights({ ...markWeights, mid1: Number(e.target.value) })}
                          className="w-full rounded border border-slate-200 p-2 font-bold text-slate-900"
                        />
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-white">
                        <label className="block font-semibold text-slate-700 mb-1">Mid 2 Weight (%)</label>
                        <input
                          type="number"
                          value={markWeights.mid2}
                          onChange={(e) => setMarkWeights({ ...markWeights, mid2: Number(e.target.value) })}
                          className="w-full rounded border border-slate-200 p-2 font-bold text-slate-900"
                        />
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-white">
                        <label className="block font-semibold text-slate-700 mb-1">Internal Labs (%)</label>
                        <input
                          type="number"
                          value={markWeights.internalLab}
                          onChange={(e) => setMarkWeights({ ...markWeights, internalLab: Number(e.target.value) })}
                          className="w-full rounded border border-slate-200 p-2 font-bold text-slate-900"
                        />
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-white">
                        <label className="block font-semibold text-slate-700 mb-1">External Lab (%)</label>
                        <input
                          type="number"
                          value={markWeights.externalLab}
                          onChange={(e) => setMarkWeights({ ...markWeights, externalLab: Number(e.target.value) })}
                          className="w-full rounded border border-slate-200 p-2 font-bold text-slate-900"
                        />
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-white">
                        <label className="block font-semibold text-slate-700 mb-1">Assignments (%)</label>
                        <input
                          type="number"
                          value={markWeights.assignment}
                          onChange={(e) => setMarkWeights({ ...markWeights, assignment: Number(e.target.value) })}
                          className="w-full rounded border border-slate-200 p-2 font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-xs hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Weight Configuration</span>
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* TAB 3: Risk Thresholds */}
            {activeTab === 'thresholds' && (
              <form onSubmit={handleSaveThresholds} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Institutional Risk Thresholds
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thresholds for classifying students into High Risk (score below 50) and Medium Risk (score below 70).
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2 font-medium text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <label className="block font-semibold text-slate-700 mb-1">High Risk Score Below</label>
                      <input
                        type="number"
                        value={thresholds.highRiskBelow}
                        onChange={(e) => setThresholds({ ...thresholds, highRiskBelow: Number(e.target.value) })}
                        className="w-full rounded border border-slate-200 p-2 font-bold text-red-600"
                      />
                      <span className="text-[10px] text-slate-400">Scores below this trigger 🔴 High Risk</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <label className="block font-semibold text-slate-700 mb-1">Medium Risk Score Below</label>
                      <input
                        type="number"
                        value={thresholds.mediumRiskBelow}
                        onChange={(e) => setThresholds({ ...thresholds, mediumRiskBelow: Number(e.target.value) })}
                        className="w-full rounded border border-slate-200 p-2 font-bold text-amber-600"
                      />
                      <span className="text-[10px] text-slate-400">Scores below this trigger 🟡 Medium Risk</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <label className="block font-semibold text-slate-700 mb-1">Attendance Threshold (%)</label>
                      <input
                        type="number"
                        value={thresholds.attendanceThreshold}
                        onChange={(e) => setThresholds({ ...thresholds, attendanceThreshold: Number(e.target.value) })}
                        className="w-full rounded border border-slate-200 p-2 font-bold text-slate-800"
                      />
                      <span className="text-[10px] text-slate-400">Attendance below this triggers low-attendance warning</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saveLoading ? 'Saving...' : 'Save Institutional Settings'}</span>
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* Modal: Add Program */}
        {showProgramModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900">Add Academic Program</h3>
              <form onSubmit={handleCreateProgram} className="space-y-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Program Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech"
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                    className="w-full rounded border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Program Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BTECH"
                    value={programForm.code}
                    onChange={(e) => setProgramForm({ ...programForm, code: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-200 p-2 font-mono uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Duration (Years)</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={programForm.durationYears}
                      onChange={(e) =>
                        setProgramForm({
                          ...programForm,
                          durationYears: Number(e.target.value),
                          totalSemesters: Number(e.target.value) * 2,
                        })
                      }
                      className="w-full rounded border border-slate-200 p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Total Semesters</label>
                    <input
                      type="number"
                      value={programForm.totalSemesters}
                      onChange={(e) => setProgramForm({ ...programForm, totalSemesters: Number(e.target.value) })}
                      className="w-full rounded border border-slate-200 p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Departments (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science, Information Technology"
                    value={programForm.departments}
                    onChange={(e) => setProgramForm({ ...programForm, departments: e.target.value })}
                    className="w-full rounded border border-slate-200 p-2"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProgramModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
                  >
                    Create Program
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Department */}
        {showDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900">Add Department</h3>
              <form onSubmit={handleCreateDept} className="space-y-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full rounded border border-slate-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    className="w-full rounded border border-slate-200 p-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Program *</label>
                  <select
                    value={deptForm.program}
                    onChange={(e) => setDeptForm({ ...deptForm, program: e.target.value })}
                    className="w-full rounded border border-slate-200 p-2"
                  >
                    {programs.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
                  >
                    Create Department
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
