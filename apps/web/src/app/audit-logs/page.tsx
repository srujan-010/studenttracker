'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { auditLogsApi } from '@/lib/apiClient';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { History, Shield, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuditLogsPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditLogsApi.getAuditLogs({
        action: actionFilter === 'ALL' ? undefined : actionFilter,
        limit: 50,
      });
      if (res.data) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Audit & Security Logs
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Immutable tracking of logins, role updates, student creation, predictions, and threshold adjustments.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Action Filter:
          </span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded border border-slate-200 p-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="GENERATE_PREDICTION">GENERATE_PREDICTION</option>
            <option value="CREATE_STUDENT">CREATE_STUDENT</option>
            <option value="CREATE_INTERVENTION">CREATE_INTERVENTION</option>
            <option value="UPDATE_RISK_THRESHOLDS">UPDATE_RISK_THRESHOLDS</option>
          </select>
        </div>

        {/* Audit Table */}
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Audit Records"
            description="No system audit entries matched the filter."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Timestamp</th>
                  <th scope="col" className="px-4 py-3">User / Actor</th>
                  <th scope="col" className="px-4 py-3">Action</th>
                  <th scope="col" className="px-4 py-3">Target Entity</th>
                  <th scope="col" className="px-4 py-3">Details Snapshot</th>
                  <th scope="col" className="px-4 py-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                      <span>{log.userName || 'System'}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {log.userEmail || 'Automated Task'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
