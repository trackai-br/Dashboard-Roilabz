import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { driveLink } = req.body;
  if (!driveLink || typeof driveLink !== 'string') {
    return res.status(400).json({ error: 'driveLink is required' });
  }

  const folderId = extractFolderId(driveLink);
  if (!folderId) {
    return res.status(400).json({
      error: 'Link do Google Drive invalido. Use o formato: https://drive.google.com/drive/folders/{folderId}',
    });
  }

  const apiKey = process.env.GOOGLE_PICKER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PICKER_API_KEY nao configurada no servidor' });
  }

  try {
    const driveApiUrl = `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`,
      key: apiKey,
      fields: 'files(id,name,mimeType,size,thumbnailLink,webContentLink)',
      pageSize: '100',
    });

    const driveRes = await fetch(driveApiUrl);
    const driveData = await driveRes.json();

    if (driveData.error) {
      console.error('[drive/list-files] Google Drive API error:', driveData.error);

      if (driveData.error.code === 404 || driveData.error.code === 403) {
        return res.status(400).json({
          error: 'Pasta nao acessivel. Verifique se a pasta esta compartilhada como "Qualquer pessoa com o link".',
          details: driveData.error.message,
        });
      }

      return res.status(500).json({
        error: 'Erro ao acessar Google Drive',
        details: driveData.error.message,
      });
    }

    const files = (driveData.files || []).map((file: any) => ({
      id: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      type: file.mimeType.startsWith('video/') ? 'video' : 'image',
      size: parseInt(file.size || '0', 10),
      thumbnailUrl: file.thumbnailLink || null,
      driveUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
    }));

    return res.status(200).json({
      folderId,
      files,
      count: files.length,
    });
  } catch (error: any) {
    console.error('[drive/list-files] Unexpected error:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message || 'Unknown error',
    });
  }
}

/**
 * Extrai o folder ID de varios formatos de link do Google Drive:
 * - https://drive.google.com/drive/folders/ABC123
 * - https://drive.google.com/drive/folders/ABC123?usp=sharing
 * - https://drive.google.com/drive/u/0/folders/ABC123
 * - ABC123 (ID direto)
 */
function extractFolderId(link: string): string | null {
  if (/^[a-zA-Z0-9_-]{10,}$/.test(link.trim())) {
    return link.trim();
  }

  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}
