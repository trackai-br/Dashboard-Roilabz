import React, { useState, useMemo } from 'react';
import { useWizard, AdConfig, CreativeFile } from '@/contexts/WizardContext';
import { useDriveFiles, DriveError } from '@/hooks/useDriveFiles';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const FORMAT_OPTIONS = [
  { value: 'image' as const, label: 'Imagem', icon: 'img' },
  { value: 'video' as const, label: 'Video', icon: 'vid' },
  { value: 'carousel' as const, label: 'Carrossel', icon: 'car' },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Tab5Ads() {
  const { state, dispatch } = useWizard();
  const { files: driveFiles, isLoading: driveLoading, error: driveError, result: driveResult, fetchFiles, clearFiles } = useDriveFiles();

  // Initialize local state from context or defaults
  const ad = state.adConfig;
  const [destinationUrl, setDestinationUrl] = useState(ad?.destinationUrl || '');
  const [creativeFormat, setCreativeFormat] = useState<'image' | 'video' | 'carousel'>(ad?.creativeFormat || 'image');
  const [driveLink, setDriveLink] = useState(ad?.driveLink || '');
  const [creativeFiles, setCreativeFiles] = useState<CreativeFile[]>(ad?.creativeFiles || []);
  const [primaryText, setPrimaryText] = useState(ad?.primaryText || '');
  const [headline, setHeadline] = useState(ad?.headline || '');
  const [description, setDescription] = useState(ad?.description || '');
  const [utmSource, setUtmSource] = useState(ad?.utmParams.utm_source || '');
  const [utmMedium, setUtmMedium] = useState(ad?.utmParams.utm_medium || '');
  const [utmCampaign, setUtmCampaign] = useState(ad?.utmParams.utm_campaign || '');
  const [utmContent, setUtmContent] = useState(ad?.utmParams.utm_content || '');
  const [utmTerm, setUtmTerm] = useState(ad?.utmParams.utm_term || '');
  const [urlTouched, setUrlTouched] = useState(false);

  // Track which drive files are selected (by file ID)
  const [selectedDriveIds, setSelectedDriveIds] = useState<Set<string>>(() => {
    return new Set(creativeFiles.map((f) => f.id));
  });

  // New creative form (manual fallback)
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'image' | 'video'>('image');

  // Sync to context whenever values change
  const syncToContext = (overrides?: Partial<AdConfig>) => {
    const config: AdConfig = {
      destinationUrl,
      creativeFormat,
      driveLink,
      creativeFiles,
      primaryText,
      headline,
      description,
      utmParams: {
        ...(utmSource && { utm_source: utmSource }),
        ...(utmMedium && { utm_medium: utmMedium }),
        ...(utmCampaign && { utm_campaign: utmCampaign }),
        ...(utmContent && { utm_content: utmContent }),
        ...(utmTerm && { utm_term: utmTerm }),
      },
      ...overrides,
    };
    dispatch({ type: 'SET_AD_CONFIG', payload: config });
  };

  // URL validation
  const isUrlValid = destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://');
  const showUrlError = urlTouched && destinationUrl.length > 0 && !isUrlValid;

  // Creative mismatch warnings
  const creativeMismatchWarnings = useMemo(() => {
    const warnings: string[] = [];
    const fileNames = new Set(creativeFiles.map((f) => f.fileName));
    const adsetCreativeNames = new Set(
      state.adsetTypes.flatMap((t) => t.creativesInAdset).filter(Boolean)
    );
    for (const name of adsetCreativeNames) {
      if (!fileNames.has(name)) {
        warnings.push(name);
      }
    }
    return warnings;
  }, [creativeFiles, state.adsetTypes]);

  // Fetch drive files and auto-select all
  const handleFetchDrive = async () => {
    await fetchFiles(driveLink);
  };

  // When driveFiles change (after fetch), auto-select all and sync to context
  const hasDriveFiles = driveFiles.length > 0;
  const driveFilesKey = driveFiles.map((f) => f.id).join(',');

  React.useEffect(() => {
    if (!hasDriveFiles) return;
    const allIds = new Set(driveFiles.map((f) => f.id));
    setSelectedDriveIds(allIds);

    const mapped: CreativeFile[] = driveFiles.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      driveUrl: f.driveUrl,
      type: f.type,
    }));
    setCreativeFiles(mapped);
    syncToContext({ creativeFiles: mapped, driveLink });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveFilesKey]);

  // Toggle drive file selection
  const toggleDriveFile = (fileId: string) => {
    const next = new Set(selectedDriveIds);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    setSelectedDriveIds(next);

    // Rebuild creativeFiles from selection
    const fromDrive: CreativeFile[] = driveFiles
      .filter((f) => next.has(f.id))
      .map((f) => ({ id: f.id, fileName: f.fileName, driveUrl: f.driveUrl, type: f.type }));
    // Keep manually added files (those not in driveFiles)
    const driveIds = new Set(driveFiles.map((f) => f.id));
    const manual = creativeFiles.filter((f) => !driveIds.has(f.id));
    const updated = [...fromDrive, ...manual];
    setCreativeFiles(updated);
    syncToContext({ creativeFiles: updated });
  };

  // Add creative (manual fallback)
  const addCreative = () => {
    const name = newFileName.trim();
    if (!name) return;
    const file: CreativeFile = {
      id: generateId(),
      fileName: name,
      driveUrl: '',
      type: newFileType,
    };
    const updated = [...creativeFiles, file];
    setCreativeFiles(updated);
    setNewFileName('');
    syncToContext({ creativeFiles: updated });
  };

  // Remove creative
  const removeCreative = (id: string) => {
    const updated = creativeFiles.filter((f) => f.id !== id);
    setCreativeFiles(updated);
    selectedDriveIds.delete(id);
    setSelectedDriveIds(new Set(selectedDriveIds));
    syncToContext({ creativeFiles: updated });
  };

  // UTM preview URL
  const utmPreview = useMemo(() => {
    const base = destinationUrl || 'https://meusite.com/oferta';
    const params = new URLSearchParams();
    if (utmSource) params.set('utm_source', utmSource);
    if (utmMedium) params.set('utm_medium', utmMedium);
    if (utmCampaign) params.set('utm_campaign', utmCampaign);
    if (utmContent) params.set('utm_content', utmContent);
    if (utmTerm) params.set('utm_term', utmTerm);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [destinationUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm]);

  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border-light)',
    color: 'var(--color-primary)',
  };

  const headingFont = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };

  // Blur handler to sync on field exit
  const handleBlur = () => syncToContext();

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div
        className="flex items-start gap-3 p-4 rounded-lg"
        style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.3)' }}
      >
        <svg width="20" height="20" className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--neon-cyan)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div>
          <p className="text-sm" style={{ color: 'var(--neon-cyan)' }}>
            O nome de cada anuncio sera o mesmo do seu conjunto (adset) correspondente.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
            As paginas empresariais foram definidas automaticamente na Etapa 2 — o sistema distribui as paginas entre as campanhas.
          </p>
        </div>
      </div>

      {/* Section 1 — URL de Destino */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-primary)', ...headingFont }}>
          URL de Destino
        </h3>
        <input
          type="text"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          onBlur={() => { setUrlTouched(true); handleBlur(); }}
          placeholder="https://meusite.com/oferta"
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={{
            ...inputStyle,
            borderColor: showUrlError ? 'var(--color-danger)' : 'var(--border-light)',
          }}
        />
        {showUrlError && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
            URL deve comecar com http:// ou https://
          </p>
        )}
      </div>

      {/* Section 2 — Formato do Criativo */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-primary)', ...headingFont }}>
          Formato do Criativo
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {FORMAT_OPTIONS.map((opt) => {
            const isSelected = creativeFormat === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setCreativeFormat(opt.value); syncToContext({ creativeFormat: opt.value }); }}
                className="p-3 rounded-lg border text-center transition-all"
                style={{
                  backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isSelected ? 'rgba(57, 255, 20, 0.5)' : 'var(--border-light)',
                  boxShadow: isSelected ? '0 0 12px rgba(57, 255, 20, 0.15)' : 'none',
                }}
              >
                <FormatIcon type={opt.icon} selected={isSelected} />
                <p className="text-sm font-medium mt-1" style={{ color: isSelected ? 'var(--neon-green)' : 'var(--color-primary)' }}>
                  {opt.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3 — Criativos (Google Drive) */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-primary)', ...headingFont }}>
          Upload de Criativos via Google Drive
        </h3>

        {/* Drive link input + fetch button */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            onBlur={handleBlur}
            placeholder="https://drive.google.com/drive/folders/..."
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
          <button
            onClick={handleFetchDrive}
            disabled={driveLoading || !driveLink.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap disabled:opacity-30"
            style={{
              backgroundColor: 'rgba(57, 255, 20, 0.15)',
              color: 'var(--neon-green)',
              border: '1px solid rgba(57, 255, 20, 0.3)',
            }}
          >
            {driveLoading ? 'Buscando...' : 'Buscar Criativos'}
          </button>
        </div>

        {/* Loading state */}
        {driveLoading && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-3" style={{ backgroundColor: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
            <svg className="animate-spin h-4 w-4" style={{ color: 'var(--neon-green)' }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm" style={{ color: 'var(--neon-green)' }}>Buscando arquivos do Drive...</span>
          </div>
        )}

        {/* Error state */}
        {driveError && <DriveErrorBox error={driveError} />}

        {/* Drive files list (from fetch) */}
        {driveFiles.length > 0 && !driveLoading && (
          <div className="mb-3">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--neon-green)' }}>
              {driveResult?.folderName && (<span style={{ color: 'var(--color-secondary)' }}>Pasta: {driveResult.folderName} — </span>)}
              {driveFiles.length} criativos encontrados
              {driveResult?.diagnostics && (
                <span style={{ color: 'var(--color-tertiary)' }}>
                  {' '}({driveResult.diagnostics.images || 0} img, {driveResult.diagnostics.videos || 0} vid)
                </span>
              )}
            </p>
            <div className="space-y-1.5">
              {driveFiles.map((file) => {
                const isChecked = selectedDriveIds.has(file.id);
                return (
                  <label
                    key={file.id}
                    className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      backgroundColor: isChecked ? 'rgba(57, 255, 20, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isChecked ? 'rgba(57, 255, 20, 0.25)' : 'var(--border-light)'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDriveFile(file.id)}
                      className="rounded"
                      style={{ accentColor: 'var(--neon-green)' }}
                    />
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: file.type === 'video' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 240, 255, 0.1)',
                        color: file.type === 'video' ? '#a78bfa' : 'var(--neon-cyan)',
                      }}
                    >
                      {file.type === 'video' ? 'VID' : 'IMG'}
                    </span>
                    <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-primary)' }}>
                      {file.fileName}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
                      {formatFileSize(file.size)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="flex items-center gap-3 my-4" style={{ opacity: 0.5 }}>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
          <span className="text-xs" style={{ color: 'var(--color-tertiary)' }}>OU adicione manualmente</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-light)' }} />
        </div>

        {/* Existing creative files list (selected from Drive + manual) */}
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
          Criativos selecionados ({creativeFiles.length})
        </p>

        {creativeFiles.length > 0 && (
          <div className="space-y-2 mb-3">
            {creativeFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)' }}>
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: file.type === 'video' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 240, 255, 0.1)',
                    color: file.type === 'video' ? '#a78bfa' : 'var(--neon-cyan)',
                  }}
                >
                  {file.type === 'video' ? 'VID' : 'IMG'}
                </span>
                <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-primary)' }}>
                  {file.fileName}
                </span>
                {file.driveUrl ? (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(57, 255, 20, 0.1)', color: 'var(--neon-green)' }}>
                    Drive
                  </span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255, 183, 3, 0.1)', color: '#ffb703' }}>
                    Manual
                  </span>
                )}
                <button
                  onClick={() => removeCreative(file.id)}
                  className="p-1 rounded hover:bg-white/10"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <svg width="16" height="16" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add creative form (manual fallback) */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCreative()}
            placeholder="video_cr1_final.mp4"
            className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
          <button
            onClick={() => setNewFileType(newFileType === 'image' ? 'video' : 'image')}
            className="px-2 py-1.5 rounded-lg border text-xs font-medium transition-all"
            style={{
              backgroundColor: newFileType === 'video' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 240, 255, 0.1)',
              borderColor: newFileType === 'video' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(0, 240, 255, 0.3)',
              color: newFileType === 'video' ? '#a78bfa' : 'var(--neon-cyan)',
            }}
          >
            {newFileType === 'video' ? 'VID' : 'IMG'}
          </button>
          <button
            onClick={addCreative}
            disabled={!newFileName.trim()}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
            style={{ backgroundColor: 'rgba(57, 255, 20, 0.15)', color: 'var(--neon-green)', border: '1px solid rgba(57, 255, 20, 0.3)' }}
          >
            + Adicionar
          </button>
        </div>

        {/* Mismatch warnings */}
        {creativeMismatchWarnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {creativeMismatchWarnings.map((name, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255, 183, 3, 0.1)', border: '1px solid rgba(255, 183, 3, 0.3)', color: '#ffb703' }}>
                <svg width="14" height="14" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>Criativo &ldquo;{name}&rdquo; referenciado na Tab 4 nao foi encontrado nos arquivos listados.</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4 — Textos do Anuncio */}
      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-primary)', ...headingFont }}>
          Textos do Anuncio
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-secondary)' }}>Texto Principal</label>
              <textarea
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                onBlur={handleBlur}
                placeholder="Descubra como transformar seus resultados..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-secondary)' }}>Titulo (Headline)</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                onBlur={handleBlur}
                placeholder="Oferta Exclusiva"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-secondary)' }}>Descricao</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleBlur}
                placeholder="Saiba mais sobre nossa solucao"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Ad Preview */}
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-secondary)' }}>Preview do Anuncio</label>
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#242436', border: '1px solid var(--border-light)' }}>
              {/* Preview header */}
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(57, 255, 20, 0.2)' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Sua Pagina</p>
                  <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>Patrocinado</p>
                </div>
              </div>
              {/* Primary text */}
              <div className="px-3 pb-2">
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-primary)' }}>
                  {primaryText || 'Texto principal do anuncio...'}
                </p>
              </div>
              {/* Image placeholder */}
              <div className="w-full h-32 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
                  [{creativeFormat === 'video' ? 'Video' : creativeFormat === 'carousel' ? 'Carrossel' : 'Imagem'}]
                </span>
              </div>
              {/* Headline + description */}
              <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                <p className="text-xs truncate" style={{ color: 'var(--color-tertiary)' }}>
                  {destinationUrl || 'meusite.com'}
                </p>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-primary)' }}>
                  {headline || 'Titulo do anuncio'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-secondary)' }}>
                  {description || 'Descricao do anuncio'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5 — UTMs */}
      <div>
        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--color-primary)', ...headingFont }}>
          Parametros de URL (UTMs)
        </h3>
        <p className="text-xs mb-3" style={{ color: 'var(--color-tertiary)' }}>
          Mesmos para todos os anuncios. Todos os campos sao opcionais.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'utm_source', value: utmSource, setter: setUtmSource, placeholder: 'facebook' },
            { label: 'utm_medium', value: utmMedium, setter: setUtmMedium, placeholder: 'cpc' },
            { label: 'utm_campaign', value: utmCampaign, setter: setUtmCampaign, placeholder: 'leva08' },
            { label: 'utm_content', value: utmContent, setter: setUtmContent, placeholder: 'cr1_video' },
            { label: 'utm_term', value: utmTerm, setter: setUtmTerm, placeholder: 'oferta' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-secondary)' }}>{field.label}</label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                onBlur={handleBlur}
                placeholder={field.placeholder}
                className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {/* URL Preview */}
        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-tertiary)' }}>Preview da URL final:</p>
          <p className="text-xs font-mono break-all" style={{ color: 'var(--neon-cyan)' }}>
            {utmPreview}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Drive Error Display ---
const ERROR_CONFIG: Record<string, { icon: 'lock' | 'search' | 'file' | 'warning' | 'server'; color: string; bg: string; border: string }> = {
  FOLDER_PRIVATE:   { icon: 'lock',    color: '#ff6464', bg: 'rgba(255, 100, 100, 0.08)', border: 'rgba(255, 100, 100, 0.3)' },
  FOLDER_NOT_FOUND: { icon: 'search',  color: '#ffb703', bg: 'rgba(255, 183, 3, 0.08)',   border: 'rgba(255, 183, 3, 0.3)' },
  NO_MEDIA_FILES:   { icon: 'file',    color: '#ffb703', bg: 'rgba(255, 183, 3, 0.08)',   border: 'rgba(255, 183, 3, 0.3)' },
  INVALID_LINK:     { icon: 'warning', color: '#ffb703', bg: 'rgba(255, 183, 3, 0.08)',   border: 'rgba(255, 183, 3, 0.3)' },
  MISSING_LINK:     { icon: 'warning', color: '#ffb703', bg: 'rgba(255, 183, 3, 0.08)',   border: 'rgba(255, 183, 3, 0.3)' },
  RATE_LIMITED:     { icon: 'warning', color: '#ffb703', bg: 'rgba(255, 183, 3, 0.08)',   border: 'rgba(255, 183, 3, 0.3)' },
  API_KEY_INVALID:  { icon: 'server',  color: '#ff6464', bg: 'rgba(255, 100, 100, 0.08)', border: 'rgba(255, 100, 100, 0.3)' },
  MISSING_API_KEY:  { icon: 'server',  color: '#ff6464', bg: 'rgba(255, 100, 100, 0.08)', border: 'rgba(255, 100, 100, 0.3)' },
};

function DriveErrorBox({ error }: { error: DriveError }) {
  const cfg = ERROR_CONFIG[error.code] || { icon: 'warning' as const, color: '#ff6464', bg: 'rgba(255, 100, 100, 0.08)', border: 'rgba(255, 100, 100, 0.3)' };

  return (
    <div className="p-3 rounded-lg mb-3 space-y-2" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-start gap-2">
        <ErrorIcon type={cfg.icon} color={cfg.color} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: cfg.color }}>{error.message}</p>
          <p className="text-xs mt-1" style={{ color: cfg.color, opacity: 0.8 }}>{error.hint}</p>
        </div>
      </div>
      {error.diagnostics?.fileTypesFound && (
        <div className="flex flex-wrap gap-1 mt-2 pl-6">
          {error.diagnostics.fileTypesFound.map((ext: string, i: number) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-tertiary)' }}>
              .{ext}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorIcon({ type, color }: { type: string; color: string }) {
  const cls = "w-4 h-4 flex-shrink-0 mt-0.5";
  if (type === 'lock') {
    return (
      <svg width="16" height="16" className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  if (type === 'search') {
    return (
      <svg width="16" height="16" className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    );
  }
  if (type === 'file') {
    return (
      <svg width="16" height="16" className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    );
  }
  if (type === 'server') {
    return (
      <svg width="16" height="16" className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
      </svg>
    );
  }
  // warning (default)
  return (
    <svg width="16" height="16" className={cls} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

// --- Format Icons ---
function FormatIcon({ type, selected }: { type: string; selected: boolean }) {
  const color = selected ? 'var(--neon-green)' : 'var(--color-secondary)';
  if (type === 'img') {
    return (
      <svg width="24" height="24" className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    );
  }
  if (type === 'vid') {
    return (
      <svg width="24" height="24" className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
      </svg>
    );
  }
  // carousel
  return (
    <svg width="24" height="24" className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-1.243 1.007-2.25 2.25-2.25h13.5" />
    </svg>
  );
}
