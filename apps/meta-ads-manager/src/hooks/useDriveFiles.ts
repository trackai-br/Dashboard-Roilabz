import { useState } from 'react';
import { authenticatedFetch } from '@/lib/api-client';

export interface DriveFile {
  id: string;
  fileName: string;
  mimeType: string;
  type: 'image' | 'video';
  size: number;
  thumbnailUrl: string | null;
  driveUrl: string;
}

export type DriveErrorCode =
  | 'MISSING_LINK'
  | 'INVALID_LINK'
  | 'MISSING_API_KEY'
  | 'FOLDER_NOT_FOUND'
  | 'FOLDER_PRIVATE'
  | 'NO_MEDIA_FILES'
  | 'API_KEY_INVALID'
  | 'RATE_LIMITED'
  | 'DRIVE_API_ERROR'
  | 'INTERNAL_ERROR'
  | 'CONNECTION_ERROR';

export interface DriveError {
  code: DriveErrorCode;
  message: string;
  hint: string;
  diagnostics?: Record<string, any>;
}

interface DriveFilesResult {
  folderName?: string;
  diagnostics?: {
    totalFiles: number;
    mediaFiles: number;
    images?: number;
    videos?: number;
    fileTypesFound?: string[];
  };
}

interface UseDriveFilesReturn {
  files: DriveFile[];
  isLoading: boolean;
  error: DriveError | null;
  result: DriveFilesResult | null;
  fetchFiles: (driveLink: string) => Promise<void>;
  clearFiles: () => void;
}

export function useDriveFiles(): UseDriveFilesReturn {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DriveError | null>(null);
  const [result, setResult] = useState<DriveFilesResult | null>(null);

  const fetchFiles = async (driveLink: string) => {
    if (!driveLink.trim()) {
      setError({
        code: 'MISSING_LINK',
        message: 'Link do Google Drive nao informado.',
        hint: 'Cole o link da pasta do Google Drive no campo acima.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await authenticatedFetch('/api/drive/list-files', {
        method: 'POST',
        body: JSON.stringify({ driveLink }),
      });

      const data = await response.json();

      // Resposta com erro HTTP
      if (!response.ok) {
        setError({
          code: data.errorCode || 'DRIVE_API_ERROR',
          message: data.error || 'Erro ao buscar arquivos do Drive.',
          hint: data.hint || 'Verifique o link e tente novamente.',
          diagnostics: data.diagnostics,
        });
        setFiles([]);
        return;
      }

      // Resposta 200 mas com errorCode (ex: pasta vazia, sem midia)
      if (data.errorCode) {
        setError({
          code: data.errorCode,
          message: data.error,
          hint: data.hint,
          diagnostics: data.diagnostics,
        });
        setResult({
          folderName: data.folderName,
          diagnostics: data.diagnostics,
        });
        setFiles([]);
        return;
      }

      setFiles(data.files);
      setResult({
        folderName: data.folderName,
        diagnostics: data.diagnostics,
      });
      setError(null);
    } catch (err: any) {
      setError({
        code: 'CONNECTION_ERROR',
        message: 'Erro de conexao com o servidor.',
        hint: 'Verifique sua internet e tente novamente.',
      });
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setError(null);
    setResult(null);
  };

  return { files, isLoading, error, result, fetchFiles, clearFiles };
}
