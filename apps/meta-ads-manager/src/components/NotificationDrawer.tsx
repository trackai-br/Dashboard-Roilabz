import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/api-client';

interface Notification {
  id: string;
  message: string;
  campaign_id: string;
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  read: boolean;
  created_at: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  darkMode = false,
}: NotificationDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/notifications');
      if (!res.ok) throw new Error('Falha ao buscar notificações');
      return res.json();
    },
    enabled: isOpen,
    refetchInterval: 30000,
  });

  const notifications = response?.notifications || [];

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await authenticatedFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ notificationIds: ids, action: 'mark-read' }),
      });
      if (!res.ok) throw new Error('Falha ao marcar como lida');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedIds([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await authenticatedFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ notificationIds: ids, action: 'delete' }),
      });
      if (!res.ok) throw new Error('Falha ao deletar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedIds([]);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-96 shadow-lg overflow-y-auto" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b px-6 py-4" style={{ borderBottomColor: 'var(--color-text-tertiary)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-accent-dark)' }}>
                Notificações
              </h2>
              <button
                onClick={onClose}
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="m-4 rounded-lg border p-3" style={{ backgroundColor: 'rgba(255,45,120,0.06)', borderColor: 'var(--color-danger)' }}>
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  Erro ao carregar notificações
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="p-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-lg">📭</p>
                <p>Sem notificações</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg p-4 border transition-colors"
                    style={{
                      backgroundColor: notification.read ? 'var(--color-bg-base)' : 'rgba(0,212,255,0.05)',
                      borderColor: notification.read ? 'var(--color-text-tertiary)' : 'var(--color-info)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, notification.id]);
                          } else {
                            setSelectedIds(
                              selectedIds.filter((id) => id !== notification.id)
                            );
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {notification.message.split('\n')[0]}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {new Date(notification.created_at).toLocaleString('pt-BR')}
                        </p>
                        {!notification.read && (
                          <span className="mt-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-accent-dark)' }}></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-4 space-y-2" style={{ borderTopColor: 'var(--color-text-tertiary)' }}>
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => markReadMutation.mutate(selectedIds)}
                    disabled={markReadMutation.isPending}
                    className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-accent-dark)' }}
                  >
                    Marcar como Lida
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(selectedIds)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-danger)' }}
                  >
                    Deletar
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(notifications.map((n: Notification) => n.id))}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                  style={{ borderColor: 'var(--color-text-tertiary)', color: 'var(--color-text-primary)' }}
                >
                  Selecionar Tudo
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                  style={{ borderColor: 'var(--color-text-tertiary)', color: 'var(--color-text-primary)' }}
                >
                  Limpar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
