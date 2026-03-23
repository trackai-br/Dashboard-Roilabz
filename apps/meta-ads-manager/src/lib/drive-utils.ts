/**
 * Extrai o folder ID de varios formatos de link do Google Drive.
 *
 * Formatos suportados:
 * - https://drive.google.com/drive/folders/ABC123
 * - https://drive.google.com/drive/folders/ABC123?usp=sharing
 * - https://drive.google.com/drive/folders/ABC123?usp=drive_link
 * - https://drive.google.com/drive/u/0/folders/ABC123
 * - https://drive.google.com/drive/u/0/folders/ABC123?usp=sharing
 * - https://drive.google.com/open?id=ABC123
 * - https://drive.google.com/folderview?id=ABC123
 * - ABC123 (ID direto)
 *
 * Sanitiza:
 * - Remove espacos, tabs, newlines
 * - Remove trailing dots, virgulas, ponto-e-virgula
 * - Remove query params do ID capturado
 */
export function extractFolderId(link: string): string | null {
  const cleaned = link.trim().replace(/[\s\n\r\t]+/g, '');

  if (!cleaned) return null;

  // Se e so o ID (sem URL)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(cleaned)) {
    return cleaned;
  }

  // Extrair de URL
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      return sanitizeId(match[1]);
    }
  }

  return null;
}

function sanitizeId(id: string): string {
  // Remove trailing pontuacao que pode vir de copiar/colar
  return id.replace(/[.,;:!?\s]+$/, '');
}
