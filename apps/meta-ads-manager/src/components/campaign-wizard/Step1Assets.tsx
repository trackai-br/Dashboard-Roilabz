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
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
          Assets for {accountName}
        </h2>
        <p className="text-gray-600 text-sm">
          Review the pixels and business pages available for this account. You'll select these in the next steps.
        </p>
      </div>

      {/* Pixels Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          Tracking Pixels
        </h3>
        {pixelsLoading ? (
          <p className="text-gray-500">Loading pixels...</p>
        ) : !pixels || pixels.length === 0 ? (
          <div className="p-4 rounded-lg bg-yellow-50">
            <p className="text-yellow-700 text-sm">No pixels found for this account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pixels.map((pixel: MetaPixel) => (
              <div key={pixel.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="font-medium text-gray-900">{pixel.name}</h4>
                <p className="text-xs text-gray-500 mt-1">ID: {pixel.id}</p>
                {pixel.last_fired_time && (
                  <p className="text-xs text-gray-500 mt-1">
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
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          Business Pages
        </h3>
        {pagesLoading ? (
          <p className="text-gray-500">Loading pages...</p>
        ) : !pages || pages.length === 0 ? (
          <div className="p-4 rounded-lg bg-yellow-50">
            <p className="text-yellow-700 text-sm">No business pages found for this account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((page: MetaPage) => (
              <div key={page.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="font-medium text-gray-900">{page.name}</h4>
                <p className="text-xs text-gray-500 mt-1">ID: {page.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-info)' }}>
          ℹ️ <strong>Note:</strong> Pixels are used for tracking conversions, and business pages are
          where your ads will be published. You'll need to select at least one of each for your ads.
        </p>
      </div>
    </div>
  );
}
