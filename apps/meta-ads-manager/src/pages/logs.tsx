import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useSyncLogs, SyncLog } from '@/hooks/useSyncLogs';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  success: { label: 'Sucesso', color: 'var(--color-success)', icon: CheckCircle },
  partial: { label: 'Parcial', color: 'var(--color-warning)', icon: AlertCircle },
  failed: { label: 'Falhou', color: 'var(--color-danger)', icon: AlertCircle },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('pt-BR');
}

export default function LogsPage() {
  const { data: logs = [], isLoading, error } = useSyncLogs();

  return (
    <DashboardLayout title="Logs">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Logs', href: '/logs' }]} />

      <div style={{ padding: '16px 24px 24px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.03em', color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
            Logs de Sincronização
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
            Histórico de sincronizações com a Meta API
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-danger)' }}>
              Erro ao carregar logs
            </p>
          </div>
        )}

        {/* Table */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-surface)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-sidebar)' }}>
                {['Status', 'Contas', 'Páginas', 'Pixels', 'Data/Hora', 'Detalhes'].map(h => (
                  <th key={h} className="col-header" style={{ padding: '0 16px', height: '36px', textAlign: 'left', verticalAlign: 'middle' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Carregando logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Nenhuma sincronização realizada ainda</td></tr>
              ) : logs.map((log: SyncLog) => {
                const cfg = STATUS_CONFIG[log.status] || { label: 'Desconhecido', color: 'var(--color-text-tertiary)', icon: Clock };
                const Icon = cfg.icon;
                const hasErrors = log.error_details && Object.keys(log.error_details).length > 0;
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', height: '44px' }}>
                    <td style={{ padding: '0 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={14} strokeWidth={2} style={{ color: cfg.color }} aria-hidden="true" />
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0 16px' }}><span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>{log.synced_accounts}</span></td>
                    <td style={{ padding: '0 16px' }}><span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>{log.synced_pages}</span></td>
                    <td style={{ padding: '0 16px' }}><span className="value-mono" style={{ color: 'var(--color-text-primary)' }}>{log.synced_pixels}</span></td>
                    <td style={{ padding: '0 16px', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td style={{ padding: '0 16px' }}>
                      {hasErrors ? (
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-warning)', cursor: 'pointer', listStyle: 'none' }}>
                            Ver erros
                          </summary>
                          <div style={{
                            marginTop: '8px',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-warning-bg)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: 'var(--color-warning)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxWidth: '320px',
                          }}>
                            {JSON.stringify(log.error_details, null, 2)}
                          </div>
                        </details>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <p style={{ marginTop: '12px', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
          Logs atualizam automaticamente a cada 10 segundos. Clique em &quot;Ver erros&quot; para detalhes técnicos.
        </p>
      </div>
    </DashboardLayout>
  );
}
