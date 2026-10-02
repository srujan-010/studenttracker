'use client';

import React, { useState } from 'react';
import { Cpu, X, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { predictionsApi } from '@/lib/apiClient';
import { FeatureInputs, PredictionResult } from '@eduguard/shared';
import { Badge } from '@/components/ui/Badge';

interface PredictionRunModalProps {
  studentId: string;
  studentName: string;
  initialFeatures?: FeatureInputs;
  onSuccess: (result: PredictionResult) => void;
  onClose: () => void;
}

export function PredictionRunModal({
  studentId,
  studentName,
  initialFeatures,
  onSuccess,
  onClose,
}: PredictionRunModalProps) {
  const [features, setFeatures] = useState<FeatureInputs>({
    attendance: initialFeatures?.attendance ?? 75,
    previousScore: initialFeatures?.previousScore ?? 65,
    internalMarks: initialFeatures?.internalMarks ?? 60,
    assignmentCompletion: initialFeatures?.assignmentCompletion ?? 70,
    studyHours: initialFeatures?.studyHours ?? 8,
    participation: initialFeatures?.participation ?? 65,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictionsApi.generate(studentId, features);
      if (res.data) {
        setResult(res.data);
        onSuccess(res.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to communicate with AI prediction microservice.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-blue-600 p-2 text-white shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Run ANN Performance Prediction</h3>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Neural Network Estimation Generated</span>
                  </div>
                  <Badge variant="risk">{result.riskLevel}</Badge>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {result.predictedScore.toFixed(1)} / 100
                  </span>
                  <span className="text-xs text-slate-500">Predicted Final Examination Score</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Model Engine: {result.modelVersion} &bull; MSE: 17.38
                </p>
              </div>

              {/* Factors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Potential Contributing Factors ({result.riskFactors.length})
                </h4>
                {result.riskFactors.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No adverse risk indicators identified.</p>
                ) : (
                  <div className="space-y-2">
                    {result.riskFactors.map((rf, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-slate-200 bg-white p-2.5 text-xs flex items-start justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{rf.factor}</p>
                          <p className="text-slate-600 mt-0.5">{rf.description}</p>
                        </div>
                        <Badge variant="priority">{rf.severity}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Recommended Interventions
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRun} className="space-y-4">
              <p className="text-xs text-slate-600">
                Adjust academic feature values to evaluate the Artificial Neural Network’s non-linear regression response:
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Attendance */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Attendance Rate</span>
                    <span className="font-bold">{features.attendance}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={features.attendance}
                    onChange={(e) => setFeatures({ ...features, attendance: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Previous Score */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Previous Academic Score</span>
                    <span className="font-bold">{features.previousScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={features.previousScore}
                    onChange={(e) => setFeatures({ ...features, previousScore: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Internal Marks */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Internal Assessment Marks</span>
                    <span className="font-bold">{features.internalMarks}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={features.internalMarks}
                    onChange={(e) => setFeatures({ ...features, internalMarks: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Assignment Completion */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Assignment Completion</span>
                    <span className="font-bold">{features.assignmentCompletion}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={features.assignmentCompletion}
                    onChange={(e) => setFeatures({ ...features, assignmentCompletion: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Weekly Study Hours */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Study Hours / Week</span>
                    <span className="font-bold">{features.studyHours} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="35"
                    value={features.studyHours}
                    onChange={(e) => setFeatures({ ...features, studyHours: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Class Participation */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Classroom Participation</span>
                    <span className="font-bold">{features.participation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={features.participation}
                    onChange={(e) => setFeatures({ ...features, participation: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Calls FastAPI &bull; TensorFlow 2.16 ANN Service
                </span>
                <div className="flex gap-2">
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
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    <span>Execute Prediction</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
