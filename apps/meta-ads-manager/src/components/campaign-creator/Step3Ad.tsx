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
  darkMode?: boolean;
}

export function Step3Ad({
  accountId,
  data,
  onChange,
  darkMode = false,
}: Step3AdProps) {
  const inputClass = darkMode
    ? 'dark:bg-gray-800 dark:border-gray-600 dark:text-white'
    : 'bg-white border-gray-300 text-gray-900';

  const { data: pages, isLoading: pagesLoading } = useMetaPages(accountId);
  const { data: pixels, isLoading: pixelsLoading } = useMetaPixels(accountId);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ad Name *
        </label>
        <input
          type="text"
          value={data.adName}
          onChange={(e) => onChange('adName', e.target.value)}
          placeholder="e.g., Summer Sale - Image Ad"
          className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
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
            <span className="text-sm text-gray-700 dark:text-gray-300">Paused</span>
          </label>
        </div>
      </div>

      {/* Creative Format */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Creative
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
          >
            <option value="single_image">Single Image</option>
            <option value="single_video">Single Video</option>
            <option value="carousel">Carousel</option>
            <option value="collection">Collection</option>
          </select>
        </div>

        {(data.creativeFormat === 'single_image' || data.creativeFormat === 'carousel') && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={data.creativeImageUrl || ''}
              onChange={(e) => onChange('creativeImageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
            />
          </div>
        )}

        {(data.creativeFormat === 'single_video' || data.creativeFormat === 'carousel') && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video URL
            </label>
            <input
              type="url"
              value={data.creativeVideoUrl || ''}
              onChange={(e) => onChange('creativeVideoUrl', e.target.value)}
              placeholder="https://example.com/video.mp4"
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
            />
          </div>
        )}
      </div>

      {/* Copy */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ad Copy
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Headline *
            </label>
            <input
              type="text"
              value={data.creativeHeadline}
              onChange={(e) => onChange('creativeHeadline', e.target.value)}
              placeholder="e.g., Don't Miss Out!"
              maxLength={125}
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {data.creativeHeadline.length}/125 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Body Text *
            </label>
            <textarea
              value={data.creativeBody}
              onChange={(e) => onChange('creativeBody', e.target.value)}
              placeholder="e.g., Get 50% off on all summer items this week only!"
              maxLength={300}
              rows={4}
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {data.creativeBody.length}/300 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destination URL *
            </label>
            <input
              type="url"
              value={data.creativeUrl}
              onChange={(e) => onChange('creativeUrl', e.target.value)}
              placeholder="https://example.com/summer-sale"
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
            />
          </div>
        </div>
      </div>

      {/* Tracking & Destination */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tracking & Destination
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Facebook Page *
            </label>
            <select
              value={data.pageId}
              onChange={(e) => onChange('pageId', e.target.value)}
              disabled={pagesLoading}
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conversion Pixel (Optional)
            </label>
            <select
              value={data.pixelId || ''}
              onChange={(e) => onChange('pixelId', e.target.value || undefined)}
              disabled={pixelsLoading}
              className={`w-full rounded-lg border px-4 py-2 ${inputClass}`}
            >
              <option value="">No pixel</option>
              {pixels?.map((pixel) => (
                <option key={pixel.id} value={pixel.id}>
                  {pixel.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select a pixel to track conversions from this ad
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
        <p className="text-sm text-green-800 dark:text-green-300">
          ✓ <strong>Ready to create:</strong> All required fields are set. Click "Create Campaign"
          to launch your campaign!
        </p>
      </div>
    </div>
  );
}
