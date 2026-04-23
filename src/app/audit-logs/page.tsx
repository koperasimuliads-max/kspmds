'use client';

import { useState } from 'react';
import { useKSP } from '@/context/KSPContext';
import BackButton from '@/components/BackButton';

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('id-ID');
  } catch {
    return dateStr;
  }
}

export default function AuditLogsPage() {
  const { auditLogs } = useKSP();
  const [filterTable, setFilterTable] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs
    .filter(log => {
      if (filterTable !== 'all' && log.tableName !== filterTable) return false;
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return log.details.toLowerCase().includes(term) ||
               log.recordId.toLowerCase().includes(term) ||
               log.action.toLowerCase().includes(term);
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const tableOptions = ['all', ...Array.from(new Set(auditLogs.map(log => log.tableName)))];
  const actionOptions = ['all', ...Array.from(new Set(auditLogs.map(log => log.action)))];

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cari</label>
            <input
              type="text"
              placeholder="Cari details atau ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Table</label>
            <select
              value={filterTable}
              onChange={e => setFilterTable(e.target.value)}
              className="border p-2 rounded w-full"
            >
              {tableOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Semua Table' : option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Action</label>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="border p-2 rounded w-full"
            >
              {actionOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Semua Action' : option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterTable('all');
                setFilterAction('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 w-full"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-3">Waktu</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Table</th>
                <th className="text-left p-3">Record ID</th>
                <th className="text-left p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4 text-slate-500">
                    {auditLogs.length === 0 ? 'Belum ada audit logs' : 'Tidak ada logs yang sesuai filter'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 text-xs text-slate-600">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">{log.tableName}</td>
                    <td className="p-3 font-mono text-xs">{log.recordId}</td>
                    <td className="p-3 text-sm max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 0 && (
          <div className="p-4 bg-slate-50 text-sm text-slate-600">
            Menampilkan {filteredLogs.length} dari {auditLogs.length} total logs
          </div>
        )}
      </div>
    </div>
  );
}