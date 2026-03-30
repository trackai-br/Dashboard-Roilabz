import React from 'react';
import { useWizardStore, selectChecklist, selectChecklistProgress } from '@/stores/wizard-store';

export default function ChecklistSidebar() {
  const checklist = useWizardStore(selectChecklist);
  const progress = useWizardStore(selectChecklistProgress);

  return (
    <div
      className="w-64 flex-shrink-0 border-l p-4 overflow-y-auto"
      style={{
        borderLeftColor: 'rgba(57, 255, 20, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Header */}
      <h4
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{
          color: 'var(--color-tertiary)',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          letterSpacing: '0.1em',
        }}
      >
        Checklist
      </h4>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>
            {progress.done}/{progress.total}
          </span>
          <span
            className="text-xs font-medium"
            style={{
              color: progress.percent === 100 ? 'var(--color-success)' : 'var(--neon-green)',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            {progress.percent}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(57, 255, 20, 0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percent}%`,
              backgroundColor: progress.percent === 100 ? 'var(--color-success)' : 'var(--neon-green)',
              boxShadow: progress.percent > 0 ? '0 0 8px rgba(57, 255, 20, 0.4)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-2">
        {checklist.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 py-1"
          >
            {/* Checkbox icon */}
            <div
              className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: item.isComplete
                  ? 'rgba(57, 255, 20, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: item.isComplete
                  ? '1px solid rgba(57, 255, 20, 0.5)'
                  : '1px solid rgba(112, 112, 128, 0.3)',
              }}
            >
              {item.isComplete && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5L4 7L8 3"
                    stroke="var(--neon-green)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Label */}
            <span
              className="text-xs"
              style={{
                color: item.isComplete ? 'var(--color-primary)' : 'var(--color-tertiary)',
                textDecoration: item.isComplete ? 'none' : 'none',
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
              }}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Completion message */}
      {progress.percent === 100 && (
        <div
          className="mt-4 p-3 rounded-lg text-center"
          style={{
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
          }}
        >
          <p
            className="text-xs font-medium"
            style={{
              color: 'var(--color-success)',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            Pronto para publicar
          </p>
        </div>
      )}
    </div>
  );
}
