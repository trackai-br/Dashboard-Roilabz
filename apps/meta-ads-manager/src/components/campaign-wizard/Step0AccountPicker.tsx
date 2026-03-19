import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Account {
  id: string;
  name: string;
  type?: string;
  currency?: string;
}

interface Step0Props {
  formData: { accountId: string; accountName: string };
  dispatch: (action: any) => void;
}

export default function Step0AccountPicker({ formData, dispatch }: Step0Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError('Usuário não autenticado');
          return;
        }

        const res = await fetch('/api/meta/accounts', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch accounts');
        const data = await res.json();
        setAccounts(data.accounts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleSelectAccount = (account: Account) => {
    dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: { accountId: account.id, accountName: account.name },
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">⏳ Carregando contas...</div>;
  }

  if (error) {
    return <div className="bg-red-50 p-4 rounded-lg text-red-700"><strong>Erro:</strong> {error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Selecione uma Conta</h2>
      <p className="text-gray-600 mb-6">Escolha qual conta Meta você deseja usar.</p>
      {accounts.length === 0 ? (
        <div className="bg-yellow-50 p-6 rounded-lg text-center text-yellow-800">
          Nenhuma conta encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleSelectAccount(account)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                formData.accountId === account.id
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{account.name}</h3>
                {formData.accountId === account.id && <span className="text-blue-600 text-xl">✓</span>}
              </div>
              <p className="text-sm text-gray-600">ID: {account.id}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
