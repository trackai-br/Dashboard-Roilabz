import React from 'react';
import { useMetaPages } from '@/hooks/useMetaPages';
import { useMetaPixels } from '@/hooks/useMetaPixels';

interface Step3AdProps {
  accountId: string;
  data: {
    adName: string;
    adStatus: 'ACTIVE' | 'PAUSED';
    creativeHeadline: string;
    creativeBody: string;
    creativeUrl: string;
    creativeImageUrl?: string;
    creativeVideoUrl?: string;
    pixelId?: string;
    pageId: string;
    creativeFormat: 'single_image' | 'single_video' | 'carousel' | 'collection';
  };
  onChange: (field: string, value: any) => void;
}

export function Step3Ad({
  accountId,
  data,
  onChange,
}: Step3AdProps) {

  const { data: pages, isLoading: pagesLoading } = useMetaPages(accountId);
  const { data: pixels, isLoading: pixelsLoading } = useMetaPixels(accountId);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
          Ad Name *
        </label>
        <input
          type="text"
          value={data.adName}
          onChange={(e) => onChange('adName', e.target.value)}
          placeholder="e.g., Summer Sale - Image Ad"
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
          Ad Status
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="adStatus"
              value="ACTIVE"
              checked={data.adStatus === 'ACTIVE'}
              onChange={(e) => onChange('adStatus', e.target.value)}
              className="rounded"
            />
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="adStatus"
              value="PAUSED"
              checked={data.adStatus === 'PAUSED'}
              onChange={(e) => onChange('adStatus', e.target.value)}
              className="rounded"
            />
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Paused</span>
          </label>
        </div>
      </div>

      {/* Creative Format */}
      <div className="pt-6" style={{ borderTop: '1px solid var(--color-tertiary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          Creative
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
            Format *
          </label>
          <select
            value={data.creativeFormat}
            onChange={(e) =>
              onChange(
                'creativeFormat',
                e.target.value as 'single_image' | 'single_video' | 'carousel' | 'collection'
              )
            }
            className="input w-full"
          >
            <option value="single_image">Single Image</option>
            <option value="single_video">Single Video</option>
            <option value="carousel">Carousel</option>
            <option value="collection">Collection</option>
          </select>
        </div>

        {(data.creativeFormat === 'single_image' || data.creativeFormat === 'carousel') && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Image URL
            </label>
            <input
              type="url"
              value={data.creativeImageUrl || ''}
              onChange={(e) => onChange('creativeImageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="input w-full"
            />
          </div>
        )}

        {(data.creativeFormat === 'single_video' || data.creativeFormat === 'carousel') && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Video URL
            </label>
            <input
              type="url"
              value={data.creativeVideoUrl || ''}
              onChange={(e) => onChange('creativeVideoUrl', e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="input w-full"
            />
          </div>
        )}
      </div>

      {/* Copy */}
      <div className="pt-6" style={{ borderTop: '1px solid var(--color-tertiary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          Ad Copy
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Headline *
            </label>
            <input
              type="text"
              value={data.creativeHeadline}
              onChange={(e) => onChange('creativeHeadline', e.target.value)}
              placeholder="e.g., Don't Miss Out!"
              maxLength={125}
              className="input w-full"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>
              {data.creativeHeadline.length}/125 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Body Text *
            </label>
            <textarea
              value={data.creativeBody}
              onChange={(e) => onChange('creativeBody', e.target.value)}
              placeholder="e.g., Get 50% off on all summer items this week only!"
              maxLength={300}
              rows={4}
              className="input w-full"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>
              {data.creativeBody.length}/300 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Destination URL *
            </label>
            <input
              type="url"
              value={data.creativeUrl}
              onChange={(e) => onChange('creativeUrl', e.target.value)}
              placeholder="https://example.com/summer-sale"
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Tracking & Destination */}
      <div className="pt-6" style={{ borderTop: '1px solid var(--color-tertiary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
          Tracking & Destination
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Facebook Page *
            </label>
            <select
              value={data.pageId}
              onChange={(e) => onChange('pageId', e.target.value)}
              disabled={pagesLoading}
              className="input w-full"
            >
              <option value="">Select a page</option>
              {pages?.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
              Conversion Pixel (Optional)
            </label>
            <select
              value={data.pixelId || ''}
              onChange={(e) => onChange('pixelId', e.target.value || undefined)}
              disabled={pixelsLoading}
              className="input w-full"
            >
              <option value="">No pixel</option>
              {pixels?.map((pixel) => (
                <option key={pixel.id} value={pixel.id}>
                  {pixel.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-secondary)' }}>
              Select a pixel to track conversions from this ad
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-success-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-success)' }}>
          ✓ <strong>Ready to create:</strong> All required fields are set. Click &quot;Create Campaign&quot;
          to launch your campaign!
        </p>
      </div>
    </div>
  );
}
