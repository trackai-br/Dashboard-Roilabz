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

interface UseDriveFilesReturn {
  files: DriveFile[];
  isLoading: boolean;
  error: string | null;
  fetchFiles: (driveLink: string) => Promise<void>;
  clearFiles: () => void;
}

export function useDriveFiles(): UseDriveFilesReturn {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (driveLink: string) => {
    if (!driveLink.trim()) {
      setError('Cole o link da pasta do Google Drive');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/drive/list-files', {
        method: 'POST',
        body: JSON.stringify({ driveLink }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao buscar arquivos do Drive');
        setFiles([]);
        return;
      }

      if (data.files.length === 0) {
        setError('Nenhuma imagem ou video encontrado na pasta. Verifique se a pasta contem arquivos de midia.');
        setFiles([]);
        return;
      }

      setFiles(data.files);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro de conexao');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setError(null);
  };

  return { files, isLoading, error, fetchFiles, clearFiles };
}
