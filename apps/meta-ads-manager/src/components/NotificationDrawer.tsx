import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Falha ao buscar notificações');
      return res.json();
    },
    enabled: isOpen,
    refetchInterval: 30000,
  });

  const notifications = response?.notifications || [];

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 shadow-lg overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Notificações
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="m-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Erro ao carregar notificações
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg">📭</p>
                <p>Sem notificações</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg p-4 border transition-colors ${
                      notification.read
                        ? darkMode
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-gray-50'
                        : darkMode
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-blue-200 bg-blue-50'
                    }`}
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
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {notification.message.split('\n')[0]}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleString('pt-BR')}
                        </p>
                        {!notification.read && (
                          <span className="mt-2 inline-block h-2 w-2 rounded-full bg-blue-600"></span>
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
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => markReadMutation.mutate(selectedIds)}
                    disabled={markReadMutation.isPending}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Marcar como Lida
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(selectedIds)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Deletar
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(notifications.map((n: Notification) => n.id))}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Selecionar Tudo
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
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
