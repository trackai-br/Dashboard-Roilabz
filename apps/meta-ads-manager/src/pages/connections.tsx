import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import MetaAuthButton from '@/components/MetaAuthButton';
import GoogleAuthButton from '@/components/GoogleAuthButton';

interface Connection {
  provider: 'meta' | 'google';
  connected: boolean;
  connectedAt?: string;
  userEmail?: string;
  userName?: string;
}

const ConnectionsPage: React.FC = () => {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([
    { provider: 'meta', connected: false },
    { provider: 'google', connected: false },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Simular carregamento de conexões do usuário
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Mostrar mensagem de sucesso se redirecionado com sucesso
    if (router.query.success === 'true') {
      setSuccessMessage(`✅ ${router.query.provider === 'meta' ? 'Facebook' : 'Google'} conectado com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    return () => clearTimeout(timer);
  }, [router.query]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Conexões</h1>
        <p className="text-gray-400 mb-8">
          Gerencie suas conexões com plataformas externas
        </p>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg text-green-200">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Meta/Facebook Connection */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="#1877F2"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold">Facebook / Meta</h3>
                  <p className="text-sm text-gray-400">
                    Conecte sua conta de anúncios do Facebook
                  </p>
                </div>
              </div>
              {connections[0]?.connected ? (
                <span className="inline-block px-3 py-1 bg-green-900 text-green-200 rounded-full text-sm font-semibold">
                  ✓ Conectado
                </span>
              ) : null}
            </div>

            <div className="mb-4">
              {connections[0]?.connected ? (
                <div className="text-sm text-gray-400">
                  <p>Conectado como: {connections[0]?.userName || 'Usuário'}</p>
                  <p>
                    Em: {new Date(connections[0]?.connectedAt || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Você ainda não conectou sua conta do Facebook. Clique no botão abaixo para conectar.
                </p>
              )}
            </div>

            <MetaAuthButton
              onSuccess={() => {
                setSuccessMessage('✅ Facebook conectado com sucesso!');
              }}
              onError={(error) => {
                console.error('Meta auth error:', error);
              }}
            />
          </div>

          {/* Google Connection */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold">Google Ads</h3>
                  <p className="text-sm text-gray-400">
                    Conecte sua conta do Google Ads
                  </p>
                </div>
              </div>
              {connections[1]?.connected ? (
                <span className="inline-block px-3 py-1 bg-green-900 text-green-200 rounded-full text-sm font-semibold">
                  ✓ Conectado
                </span>
              ) : null}
            </div>

            <div className="mb-4">
              {connections[1]?.connected ? (
                <div className="text-sm text-gray-400">
                  <p>Conectado como: {connections[1]?.userEmail || 'Usuário'}</p>
                  <p>
                    Em: {new Date(connections[1]?.connectedAt || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Você ainda não conectou sua conta do Google. Clique no botão abaixo para conectar.
                </p>
              )}
            </div>

            <GoogleAuthButton
              onSuccess={() => {
                setSuccessMessage('✅ Google conectado com sucesso!');
              }}
              onError={(error) => {
                console.error('Google auth error:', error);
              }}
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-900 border border-blue-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-200 mb-2">ℹ️ Por que conectar?</h4>
          <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
            <li>Sincronize automaticamente suas campanhas e anúncios</li>
            <li>Receba alertas sobre desempenho em tempo real</li>
            <li>Acesse métricas e relatórios integrados</li>
            <li>Gerencie múltiplas contas em um único painel</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConnectionsPage;
