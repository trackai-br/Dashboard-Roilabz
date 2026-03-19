'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useSyncLogs, SyncLog } from '@/hooks/useSyncLogs';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function LogsPage() {
  const { data: logs = [], isLoading, error } = useSyncLogs();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} style={{ color: '#39ff14' }} />;
      case 'partial':
        return <AlertCircle size={20} style={{ color: '#ffb703' }} />;
      case 'failed':
        return <AlertCircle size={20} style={{ color: '#ff3333' }} />;
      default:
        return <Clock size={20} style={{ color: '#a8a8b8' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#39ff14';
      case 'partial':
        return '#ffb703';
      case 'failed':
        return '#ff3333';
      default:
        return '#a8a8b8';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return 'Sucesso';
      case 'partial':
        return 'Parcial';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  return (
    <DashboardLayout>
      <div className="p-6" style={{ backgroundColor: 'var(--bg-deepest)' }}>
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              color: 'var(--neon-green)',
              textShadow: '0 0 12px rgba(57, 255, 20, 0.3)',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              letterSpacing: '0.05em',
            }}
          >
            📋 Logs de Sincronização
          </h1>
          <p style={{ color: 'var(--color-secondary)' }}>
            Histórico de sincronizações com Meta API
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{
              backgroundColor: 'rgba(255, 51, 51, 0.1)',
              borderColor: '#ff3333',
            }}
          >
            <p style={{ color: '#ff3333' }}>⚠️ Erro ao carregar logs</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p style={{ color: 'var(--color-secondary)' }}>Carregando logs...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && logs.length === 0 && (
          <div
            className="p-12 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
            }}
          >
            <p style={{ color: 'var(--neon-cyan)' }}>
              Nenhuma sincronização realizada ainda
            </p>
          </div>
        )}

        {/* Logs Table */}
        {!isLoading && logs.length > 0 && (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'rgba(57, 255, 20, 0.2)' }}>
            <table className="min-w-full divide-y" style={{ backgroundColor: 'var(--bg-card)' }}>
              <thead style={{ backgroundColor: 'var(--bg-table-header)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                    Contas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                    Páginas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                    Pixels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--color-secondary)' }}>
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(57, 255, 20, 0.1)' }}>
                {logs.map((log: SyncLog) => (
                  <tr key={log.id} style={{ borderColor: 'rgba(57, 255, 20, 0.1)' }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span style={{ color: getStatusColor(log.status) }} className="text-sm font-medium">
                          {getStatusLabel(log.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-primary)' }}>
                      {log.synced_accounts}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-primary)' }}>
                      {log.synced_pages}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-primary)' }}>
                      {log.synced_pixels}
                    </td>
                    <td className="px-6 py-4 text-sm text-nowrap" style={{ color: 'var(--color-secondary)' }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.error_details && Object.keys(log.error_details).length > 0 ? (
                        <details className="cursor-pointer">
                          <summary style={{ color: '#ffb703' }}>Ver erros</summary>
                          <div
                            className="mt-2 p-2 rounded text-xs"
                            style={{
                              backgroundColor: 'rgba(255, 183, 3, 0.1)',
                              color: '#ffb703',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {JSON.stringify(log.error_details, null, 2)}
                          </div>
                        </details>
                      ) : (
                        <span style={{ color: 'var(--color-secondary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Box */}
        <div
          className="mt-6 p-4 rounded-lg border"
          style={{
            backgroundColor: 'rgba(0, 240, 255, 0.05)',
            borderColor: 'rgba(0, 240, 255, 0.2)',
          }}
        >
          <p style={{ color: 'var(--neon-cyan)' }} className="text-sm">
            ℹ️ <strong>Info:</strong> Os logs atualizam automaticamente a cada 10 segundos. Clique em &quot;Ver erros&quot; para detalhes técnicos.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
