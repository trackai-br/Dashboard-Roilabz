import React, { useState, useCallback, useMemo } from 'react';
import { useWizardStore, selectAdConfig, selectBatches } from '@/stores/wizard-store';
import type { AdConfig } from '@/stores/wizard-store';

const defaultAdConfig: AdConfig = {
  destinationUrl: '',
  primaryText: '',
  headline: '',
  description: '',
  utmParams: {},
};

export default function AdCopyStep() {
  const adConfig = useWizardStore(selectAdConfig);
  const batches = useWizardStore(selectBatches);
  const setAdConfig = useWizardStore((s) => s.setAdConfig);

  const [perLoteCopy, setPerLoteCopy] = useState(false);

  const config = useMemo<AdConfig>(() => adConfig ?? defaultAdConfig, [adConfig]);

  const update = useCallback((updates: Partial<AdConfig>) => {
    setAdConfig({ ...config, ...updates });
  }, [config, setAdConfig]);

  const updateUtm = useCallback((key: string, value: string) => {
    setAdConfig({
      ...config,
      utmParams: { ...config.utmParams, [key]: value },
    });
  }, [config, setAdConfig]);

  // UTM preview
  const utmPreview = Object.entries(config.utmParams)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const fullUrlPreview = config.destinationUrl
    ? `${config.destinationUrl}${utmPreview ? (config.destinationUrl.includes('?') ? '&' : '?') + utmPreview : ''}`
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
        >
          Copy do Anuncio
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
          Texto e URL de destino dos anuncios
        </p>
      </div>

      {/* Per-lote toggle */}
      {batches.length > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPerLoteCopy(!perLoteCopy)}
            className="relative w-10 h-5 rounded-full transition-all"
            style={{ backgroundColor: perLoteCopy ? 'var(--neon-green)' : 'rgba(255,255,255,0.15)' }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: perLoteCopy ? '22px' : '2px' }}
            />
          </button>
          <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
            Copy diferente por lote
          </span>
        </div>
      )}

      {/* Destination URL */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
          URL de Destino
        </label>
        <input
          type="url"
          value={config.destinationUrl}
          onChange={(e) => update({ destinationUrl: e.target.value })}
          placeholder="https://seusite.com/oferta"
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(57, 255, 20, 0.2)',
            color: 'var(--color-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Primary Text */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
          Texto Principal
        </label>
        <textarea
          value={config.primaryText}
          onChange={(e) => update({ primaryText: e.target.value })}
          placeholder="O texto principal que aparece acima do criativo..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(57, 255, 20, 0.2)',
            color: 'var(--color-primary)',
            outline: 'none',
          }}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-tertiary)' }}>
          {config.primaryText.length}/125 caracteres (recomendado)
        </p>
      </div>

      {/* Headline */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
          Titulo (Headline)
        </label>
        <input
          type="text"
          value={config.headline}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="Titulo do anuncio"
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(57, 255, 20, 0.2)',
            color: 'var(--color-primary)',
            outline: 'none',
          }}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--color-tertiary)' }}>
          {config.headline.length}/40 caracteres (recomendado)
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
          Descricao
        </label>
        <input
          type="text"
          value={config.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Descricao complementar do anuncio"
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(57, 255, 20, 0.2)',
            color: 'var(--color-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* UTM Parameters */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'rgba(57, 255, 20, 0.03)', border: '1px solid rgba(57, 255, 20, 0.1)' }}
      >
        <label className="block text-xs font-medium mb-3" style={{ color: 'var(--color-secondary)' }}>
          Parametros UTM
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'utm_source', placeholder: 'facebook' },
            { key: 'utm_medium', placeholder: 'cpc' },
            { key: 'utm_campaign', placeholder: 'leva08' },
            { key: 'utm_content', placeholder: 'cr1' },
            { key: 'utm_term', placeholder: 'interesse' },
          ].map(({ key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-tertiary)' }}>
                {key}
              </label>
              <input
                type="text"
                value={(config.utmParams as Record<string, string>)[key] || ''}
                onChange={(e) => updateUtm(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(57, 255, 20, 0.15)',
                  color: 'var(--color-primary)',
                  outline: 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* URL Preview */}
        {fullUrlPreview && (
          <div
            className="mt-4 p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(57, 255, 20, 0.1)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-tertiary)' }}>URL final:</p>
            <p className="text-xs font-mono break-all" style={{ color: 'var(--neon-green)' }}>
              {fullUrlPreview}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
