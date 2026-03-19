import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Pixel {
  id: string;
  name: string;
  created_time?: string;
}

interface Page {
  id: string;
  name: string;
}

interface Step1Props {
  accountId: string;
}

export default function Step1Assets({ accountId }: Step1Props) {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!accountId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError('Usuário não autenticado');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const [pixelsRes, pagesRes] = await Promise.all([
          fetch(`/api/meta/pixels?accountId=${accountId}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`/api/meta/pages?accountId=${accountId}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);

        if (!pixelsRes.ok || !pagesRes.ok) throw new Error('Failed to fetch assets');

        const pixelsData = await pixelsRes.json();
        const pagesData = await pagesRes.json();

        setPixels(pixelsData.pixels || []);
        setPages(pagesData.pages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [accountId]);

  if (loading) {
    return <div className="flex items-center justify-center py-12">⏳ Carregando assets...</div>;
  }

  if (error) {
    return <div className="bg-red-50 p-4 rounded-lg text-red-700"><strong>Erro:</strong> {error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Assets Disponíveis</h2>
      <p className="text-gray-600 mb-8">Visualize os pixels e páginas sincronizadas desta conta.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Pixels ({pixels.length})</h3>
          {pixels.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum pixel encontrado</p>
          ) : (
            <ul className="space-y-2">
              {pixels.map((pixel) => (
                <li key={pixel.id} className="bg-white p-3 rounded border border-gray-200">
                  <p className="font-medium text-sm">{pixel.name}</p>
                  <p className="text-xs text-gray-500">ID: {pixel.id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📄 Páginas ({pages.length})</h3>
          {pages.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma página encontrada</p>
          ) : (
            <ul className="space-y-2">
              {pages.map((page) => (
                <li key={page.id} className="bg-white p-3 rounded border border-gray-200">
                  <p className="font-medium text-sm">{page.name}</p>
                  <p className="text-xs text-gray-500">ID: {page.id}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
