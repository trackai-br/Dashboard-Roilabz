import React, { useState, useCallback } from 'react';
import { useWizardStore, selectCreativePool, selectDistributionMode, selectBatches } from '@/stores/wizard-store';
import type { CreativeFile, DistributionMode } from '@/stores/wizard-store';
import { useDriveFiles } from '@/hooks/useDriveFiles';

const DISTRIBUTION_MODES: { value: DistributionMode; label: string; desc: string }[] = [
  { value: 'per_campaign', label: 'Por campanha', desc: '1 criativo = 1 campanha' },
  { value: 'sequential', label: 'Sequencial', desc: 'Distribui em ordem nos adsets' },
  { value: 'random', label: 'Aleatório', desc: 'Distribui aleatoriamente' },
  { value: 'manual', label: 'Manual', desc: 'Você escolhe por campanha' },
];

export default function CreativePoolStep() {
  const creativePool = useWizardStore(selectCreativePool);
  const distributionMode = useWizardStore(selectDistributionMode);
  const batches = useWizardStore(selectBatches);
  const driveLink = useWizardStore((s) => s.driveLink);
  const setCreativePool = useWizardStore((s) => s.setCreativePool);
  const setDriveLink = useWizardStore((s) => s.setDriveLink);
  const addCreativeFile = useWizardStore((s) => s.addCreativeFile);
  const removeCreativeFile = useWizardStore((s) => s.removeCreativeFile);
  const setDistributionMode = useWizardStore((s) => s.setDistributionMode);

  const { files, isLoading, error, result, fetchFiles, clearFiles } = useDriveFiles();
  const [linkInput, setLinkInput] = useState(driveLink);

  const handleFetch = useCallback(async () => {
    if (!linkInput.trim()) return;
    setDriveLink(linkInput.trim());
    await fetchFiles(linkInput.trim());
  }, [linkInput, setDriveLink, fetchFiles]);

  const handleImportAll = useCallback(() => {
    const newFiles: CreativeFile[] = files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      driveUrl: f.driveUrl,
      type: f.type,
      thumbnailUrl: f.thumbnailUrl ?? undefined,
    }));
    setCreativePool(newFiles);
  }, [files, setCreativePool]);

  const handleToggleFile = useCallback((file: typeof files[0]) => {
    const exists = creativePool.find((c) => c.id === file.id);
    if (exists) {
      removeCreativeFile(file.id);
    } else {
      addCreativeFile({
        id: file.id,
        fileName: file.fileName,
        driveUrl: file.driveUrl,
        type: file.type,
        thumbnailUrl: file.thumbnailUrl ?? undefined,
      });
    }
  }, [creativePool, addCreativeFile, removeCreativeFile]);

  // Calcular total de campanhas para preview de distribuicao
  const totalCampaigns = batches.reduce((sum, b) => sum + b.totalCampaigns, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
        >
          Pool de Criativos
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Carregue criativos de uma pasta do Google Drive e defina como distribuir entre campanhas
        </p>
      </div>

      {/* Drive URL Input */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
      >
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Link da pasta do Google Drive
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          />
          <button
            onClick={handleFetch}
            disabled={isLoading || !linkInput.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-bg-base)',
              fontFamily: "var(--font-sans)",
            }}
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && (
          <p className="text-xs mt-2" style={{ color: 'var(--color-danger)' }}>
            {error.message} — {error.hint}
          </p>
        )}
        {result?.diagnostics && (
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Pasta: {result.folderName} · {result.diagnostics.mediaFiles} arquivos de midia
            {result.diagnostics.images ? ` (${result.diagnostics.images} imagens` : ''}
            {result.diagnostics.videos ? `, ${result.diagnostics.videos} videos)` : result.diagnostics.images ? ')' : ''}
          </p>
        )}
      </div>

      {/* Thumbnail Grid */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {files.length} arquivo{files.length !== 1 ? 's' : ''} encontrado{files.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleImportAll}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                color: 'var(--color-accent)',
              }}
            >
              Importar todos ({files.length})
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {files.map((file) => {
              const isSelected = creativePool.some((c) => c.id === file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => handleToggleFile(file)}
                  className="relative rounded-lg overflow-hidden cursor-pointer transition-all group"
                  style={{
                    border: isSelected
                      ? '2px solid var(--color-accent)'
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'none',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="aspect-square bg-cover bg-center"
                    style={{
                      backgroundImage: file.thumbnailUrl ? `url(${file.thumbnailUrl})` : undefined,
                      backgroundColor: file.thumbnailUrl ? undefined : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {!file.thumbnailUrl && (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{file.type === 'video' ? 'VID' : 'IMG'}</span>
                      </div>
                    )}
                  </div>

                  {/* Overlay de selecao */}
                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                      <svg width="12" height="12" fill="var(--color-bg-base)" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* File name */}
                  <div
                    className="px-2 py-1.5 text-xs truncate"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {file.fileName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected count */}
      {creativePool.length > 0 && (
        <div
          className="flex items-center justify-between p-3 rounded-lg"
          style={{ backgroundColor: 'rgba(22, 163, 74, 0.06)', border: '1px solid rgba(22, 163, 74, 0.15)' }}
        >
          <span className="text-sm" style={{ color: 'var(--color-accent)' }}>
            {creativePool.length} criativo{creativePool.length !== 1 ? 's' : ''} selecionado{creativePool.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setCreativePool([])}
            className="text-xs px-2 py-1 rounded transition-all"
            style={{ color: 'var(--color-danger)' }}
          >
            Limpar selecao
          </button>
        </div>
      )}

      {/* Distribution Mode */}
      <div>
        <h4
          className="text-sm font-bold mb-3"
          style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
        >
          Modo de Distribuicao
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {DISTRIBUTION_MODES.map((dm) => {
            const isActive = distributionMode === dm.value;
            return (
              <button
                key={dm.value}
                onClick={() => setDistributionMode(dm.value)}
                className="flex flex-col gap-1 p-3 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: isActive ? 'rgba(22, 163, 74, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: isActive
                    ? '1px solid rgba(22, 163, 74, 0.4)'
                    : '1px solid var(--color-border)',
                }}
              >
                <span
                  className="block text-sm font-medium"
                  style={{ color: isActive ? 'var(--color-accent-bright)' : 'var(--color-text-primary)' }}
                >
                  {dm.label}
                </span>
                <span className="block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {dm.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Distribution Preview */}
      {creativePool.length > 0 && totalCampaigns > 0 && (
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <h4
            className="text-sm font-bold mb-3"
            style={{ color: 'var(--color-text-primary)', fontFamily: "var(--font-sans)" }}
          >
            Preview de Distribuicao
          </h4>
          <div className="space-y-2">
            {distributionMode === 'per_campaign' && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {creativePool.length} criativo{creativePool.length !== 1 ? 's' : ''} → {creativePool.length} campanha{creativePool.length !== 1 ? 's' : ''} (1:1).
                {creativePool.length < totalCampaigns &&
                  ` Campanhas sobrando: ${totalCampaigns - creativePool.length} ficarao sem criativo.`}
              </p>
            )}
            {distributionMode === 'sequential' && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {creativePool.length} criativo{creativePool.length !== 1 ? 's' : ''} distribuido{creativePool.length !== 1 ? 's' : ''} em ordem ciclica pelos {totalCampaigns} conjuntos.
              </p>
            )}
            {distributionMode === 'random' && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {creativePool.length} criativo{creativePool.length !== 1 ? 's' : ''} distribuido{creativePool.length !== 1 ? 's' : ''} aleatoriamente entre {totalCampaigns} conjuntos.
              </p>
            )}
            {distributionMode === 'manual' && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Voce escolhera manualmente qual criativo vai em cada campanha na etapa de preview.
              </p>
            )}

            {/* Mini preview visual */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {creativePool.slice(0, 8).map((c, i) => (
                <div
                  key={c.id}
                  className="w-8 h-8 rounded overflow-hidden"
                  style={{
                    border: '1px solid var(--color-border)',
                  }}
                  title={c.fileName}
                >
                  {c.thumbnailUrl ? (
                    <img src={c.thumbnailUrl} alt={c.fileName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      {i + 1}
                    </div>
                  )}
                </div>
              ))}
              {creativePool.length > 8 && (
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-xs"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text-tertiary)' }}
                >
                  +{creativePool.length - 8}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
