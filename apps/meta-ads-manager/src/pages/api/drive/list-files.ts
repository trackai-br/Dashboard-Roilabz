import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';

type ErrorCode =
  | 'MISSING_LINK'
  | 'INVALID_LINK'
  | 'MISSING_API_KEY'
  | 'FOLDER_NOT_FOUND'
  | 'FOLDER_PRIVATE'
  | 'NO_MEDIA_FILES'
  | 'API_KEY_INVALID'
  | 'RATE_LIMITED'
  | 'DRIVE_API_ERROR'
  | 'INTERNAL_ERROR';

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
    return res.status(400).json({
      errorCode: 'MISSING_LINK' as ErrorCode,
      error: 'Link do Google Drive nao informado.',
      hint: 'Cole o link da pasta do Google Drive no campo.',
    });
  }

  const folderId = extractFolderId(driveLink);
  if (!folderId) {
    return res.status(400).json({
      errorCode: 'INVALID_LINK' as ErrorCode,
      error: 'Link do Google Drive invalido.',
      hint: 'O link deve ser no formato: https://drive.google.com/drive/folders/... ou apenas o ID da pasta.',
      received: driveLink.substring(0, 100),
    });
  }

  const apiKey = process.env.GOOGLE_PICKER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      errorCode: 'MISSING_API_KEY' as ErrorCode,
      error: 'Chave da API do Google Drive nao configurada no servidor.',
      hint: 'Adicione GOOGLE_PICKER_API_KEY nas variaveis de ambiente da Vercel.',
    });
  }

  try {
    // Passo 1: Verificar se a pasta existe e e acessivel
    const folderCheckUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?` + new URLSearchParams({
      key: apiKey,
      fields: 'id,name,mimeType,shared',
    });

    const folderRes = await fetch(folderCheckUrl);
    const folderData = await folderRes.json();

    if (folderData.error) {
      console.error('[drive/list-files] Folder check error:', folderData.error);
      return handleDriveError(res, folderData.error, folderId);
    }

    // Verificar se e uma pasta (e nao um arquivo)
    if (folderData.mimeType !== 'application/vnd.google-apps.folder') {
      return res.status(400).json({
        errorCode: 'INVALID_LINK' as ErrorCode,
        error: 'O link aponta para um arquivo, nao uma pasta.',
        hint: 'Use o link de uma PASTA do Google Drive, nao de um arquivo individual.',
        fileName: folderData.name,
      });
    }

    const folderName = folderData.name;

    // Passo 2: Listar TODOS os arquivos da pasta (sem filtro de mime)
    const allFilesUrl = `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      key: apiKey,
      fields: 'files(id,name,mimeType,size)',
      pageSize: '100',
    });

    const allFilesRes = await fetch(allFilesUrl);
    const allFilesData = await allFilesRes.json();

    if (allFilesData.error) {
      console.error('[drive/list-files] List files error:', allFilesData.error);
      return handleDriveError(res, allFilesData.error, folderId);
    }

    const allFiles = allFilesData.files || [];
    const totalFilesInFolder = allFiles.length;

    // Passo 3: Filtrar apenas imagens e videos
    const mediaFiles = allFiles.filter((f: any) =>
      f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/')
    );

    if (totalFilesInFolder === 0) {
      return res.status(200).json({
        folderId,
        folderName,
        files: [],
        count: 0,
        errorCode: 'NO_MEDIA_FILES' as ErrorCode,
        error: 'A pasta esta vazia.',
        hint: 'A pasta nao contem nenhum arquivo. Adicione imagens ou videos e tente novamente.',
        diagnostics: { totalFiles: 0, mediaFiles: 0 },
      });
    }

    if (mediaFiles.length === 0) {
      // Pasta tem arquivos mas nenhum e midia
      const fileTypes = allFiles.map((f: any) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || 'sem extensao';
        return ext;
      });
      const uniqueTypes = [...new Set(fileTypes)].slice(0, 10);

      return res.status(200).json({
        folderId,
        folderName,
        files: [],
        count: 0,
        errorCode: 'NO_MEDIA_FILES' as ErrorCode,
        error: `A pasta contem ${totalFilesInFolder} arquivo(s), mas nenhum e imagem ou video.`,
        hint: `Arquivos encontrados: ${uniqueTypes.join(', ')}. Adicione arquivos JPG, PNG, MP4 ou outros formatos de imagem/video.`,
        diagnostics: {
          totalFiles: totalFilesInFolder,
          mediaFiles: 0,
          fileTypesFound: uniqueTypes,
        },
      });
    }

    // Passo 4: Buscar detalhes completos dos arquivos de midia
    const detailedUrl = `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')`,
      key: apiKey,
      fields: 'files(id,name,mimeType,size,thumbnailLink,webContentLink)',
      pageSize: '100',
    });

    const detailedRes = await fetch(detailedUrl);
    const detailedData = await detailedRes.json();

    if (detailedData.error) {
      console.error('[drive/list-files] Detailed fetch error:', detailedData.error);
      return handleDriveError(res, detailedData.error, folderId);
    }

    const files = (detailedData.files || []).map((file: any) => ({
      id: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      type: file.mimeType.startsWith('video/') ? 'video' : 'image',
      size: parseInt(file.size || '0', 10),
      thumbnailUrl: file.thumbnailLink || null,
      driveUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
    }));

    const imageCount = files.filter((f: any) => f.type === 'image').length;
    const videoCount = files.filter((f: any) => f.type === 'video').length;

    return res.status(200).json({
      folderId,
      folderName,
      files,
      count: files.length,
      diagnostics: {
        totalFiles: totalFilesInFolder,
        mediaFiles: files.length,
        images: imageCount,
        videos: videoCount,
      },
    });
  } catch (error: any) {
    console.error('[drive/list-files] Unexpected error:', error);
    return res.status(500).json({
      errorCode: 'INTERNAL_ERROR' as ErrorCode,
      error: 'Erro interno do servidor.',
      hint: 'Tente novamente. Se o problema persistir, verifique os logs do servidor.',
      message: error.message || 'Unknown error',
    });
  }
}

function handleDriveError(res: NextApiResponse, driveError: any, folderId: string) {
  const code = driveError.code;
  const reason = driveError.errors?.[0]?.reason || '';
  const message = driveError.message || '';

  // 404 - Pasta nao encontrada
  if (code === 404) {
    return res.status(400).json({
      errorCode: 'FOLDER_NOT_FOUND' as ErrorCode,
      error: 'Pasta nao encontrada no Google Drive.',
      hint: 'Verifique se o link esta correto e se a pasta nao foi deletada.',
      folderId,
    });
  }

  // 403 - Sem permissao
  if (code === 403) {
    if (reason === 'keyInvalid' || message.includes('API key')) {
      return res.status(500).json({
        errorCode: 'API_KEY_INVALID' as ErrorCode,
        error: 'Chave da API do Google invalida ou expirada.',
        hint: 'A API Key configurada no servidor esta invalida. Entre em contato com o suporte.',
      });
    }

    return res.status(400).json({
      errorCode: 'FOLDER_PRIVATE' as ErrorCode,
      error: 'A pasta esta privada. O sistema nao tem permissao para acessar.',
      hint: 'Abra o Google Drive, clique com botao direito na pasta → Compartilhar → Acesso geral → "Qualquer pessoa com o link".',
      folderId,
    });
  }

  // 429 - Rate limit
  if (code === 429) {
    return res.status(429).json({
      errorCode: 'RATE_LIMITED' as ErrorCode,
      error: 'Muitas requisicoes ao Google Drive. Tente novamente em alguns segundos.',
      hint: 'Aguarde 10 segundos e clique em "Buscar Criativos" novamente.',
    });
  }

  // Qualquer outro erro
  return res.status(500).json({
    errorCode: 'DRIVE_API_ERROR' as ErrorCode,
    error: `Erro do Google Drive: ${message}`,
    hint: 'Verifique se o link esta correto e se a pasta esta compartilhada publicamente.',
    details: { code, reason, message },
  });
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
