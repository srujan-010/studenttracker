'use client';

import React, { useState } from 'react';
import { X, CheckSquare, AlertCircle } from 'lucide-react';
import { interventionsApi } from '@/lib/apiClient';
import { InterventionType, InterventionPriority } from '@eduguard/shared';

interface InterventionModalProps {
  studentId: string;
  studentName: string;
  predictionId?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function InterventionModal({
  studentId,
  studentName,
  predictionId,
  onSuccess,
  onClose,
}: InterventionModalProps) {
  const [type, setType] = useState<InterventionType>('ACADEMIC_COUNSELING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<InterventionPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !dueDate) {
      setError('Please fill all required intervention fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await interventionsApi.createIntervention({
        studentId,
        predictionId,
        type,
        title,
        description,
        priority,
        dueDate,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record intervention.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-purple-600 p-2 text-white">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Academic Intervention</h3>
              <p className="text-xs text-slate-500">Student: {studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intervention Strategy
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InterventionType)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as InterventionPriority)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent Action</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Intervention Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Problem-Solving Workshop"
              className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Action Plan & Guidance Notes
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe specific learning objectives, discussion points, or milestone expectations..."
              className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Schedule Intervention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
