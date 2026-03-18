import React from 'react';
import { useMetaPixels, MetaPixel } from '../../hooks/useMetaPixels';
import { useMetaPages, MetaPage } from '../../hooks/useMetaPages';

interface Step1AssetsProps {
  accountId: string;
  accountName: string;
}

export function Step1Assets({ accountId, accountName }: Step1AssetsProps) {
  const { data: pixels, isLoading: pixelsLoading } = useMetaPixels(accountId);
  const { data: pages, isLoading: pagesLoading } = useMetaPages(accountId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--neon-green)' }}>
          Assets for {accountName}
        </h2>
        <p style={{ color: 'var(--color-secondary)' }} className="text-sm">
          Review the pixels and business pages available for this account. You&apos;ll select these in the next steps.
        </p>
      </div>

      {/* Pixels Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--neon-green)' }}>
          Tracking Pixels
        </h3>
        {pixelsLoading ? (
          <p style={{ color: 'var(--color-secondary)' }}>Loading pixels...</p>
        ) : !pixels || pixels.length === 0 ? (
          <div className="p-4 rounded-lg border border-amber-500/30" style={{ backgroundColor: 'rgba(255, 183, 3, 0.05)' }}>
            <p style={{ color: 'var(--neon-amber)' }} className="text-sm">No pixels found for this account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pixels.map((pixel: MetaPixel) => (
              <div
                key={pixel.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'rgba(57, 255, 20, 0.2)',
                  borderWidth: '1px',
                }}
              >
                <h4 style={{ color: 'var(--color-primary)' }} className="font-medium">
                  {pixel.name}
                </h4>
                <p style={{ color: 'var(--color-secondary)' }} className="text-xs mt-1">
                  ID: {pixel.id}
                </p>
                {pixel.last_fired_time && (
                  <p style={{ color: 'var(--color-secondary)' }} className="text-xs mt-1">
                    Last fired: {new Date(pixel.last_fired_time * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Business Pages Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--neon-green)' }}>
          Business Pages
        </h3>
        {pagesLoading ? (
          <p style={{ color: 'var(--color-secondary)' }}>Loading pages...</p>
        ) : !pages || pages.length === 0 ? (
          <div className="p-4 rounded-lg border border-amber-500/30" style={{ backgroundColor: 'rgba(255, 183, 3, 0.05)' }}>
            <p style={{ color: 'var(--neon-amber)' }} className="text-sm">No business pages found for this account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((page: MetaPage) => (
              <div
                key={page.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'rgba(57, 255, 20, 0.2)',
                  borderWidth: '1px',
                }}
              >
                <h4 style={{ color: 'var(--color-primary)' }} className="font-medium">
                  {page.name}
                </h4>
                <p style={{ color: 'var(--color-secondary)' }} className="text-xs mt-1">
                  ID: {page.id}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg border border-cyan-500/30" style={{ backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
        <p style={{ color: 'var(--neon-cyan)' }} className="text-sm">
          ℹ️ <strong>Note:</strong> Pixels are used for tracking conversions, and business pages are
          where your ads will be published. You&apos;ll need to select at least one of each for your ads.
        </p>
      </div>
    </div>
  );
}
