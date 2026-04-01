import React from 'react';
import { useWizardStore, selectChecklist } from '@/stores/wizard-store';
import { useShallow } from 'zustand/react/shallow';

export default function ChecklistSidebar() {
  const checklist = useWizardStore(selectChecklist);
  const progress = useWizardStore(
    useShallow((s) => {
      const total = s.checklist.length;
      const done = s.checklist.filter(item => item.isComplete).length;
      return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
    })
  );

  return (
    <div
      className="w-64 flex-shrink-0 border-l p-4 overflow-y-auto"
      style={{
        borderLeftColor: 'var(--color-border)',
        backgroundColor: 'var(--color-bg-sidebar)',
      }}
    >
      {/* Header */}
      <h4
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{
          color: 'var(--color-text-tertiary)',
          fontFamily: "var(--font-sans)",
          letterSpacing: '0.1em',
        }}
      >
        Checklist
      </h4>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {progress.done}/{progress.total}
          </span>
          <span
            className="text-xs font-medium"
            style={{
              color: progress.percent === 100 ? 'var(--color-success)' : 'var(--color-accent)',
              fontFamily: "var(--font-sans)",
            }}
          >
            {progress.percent}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-input)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percent}%`,
              backgroundColor: progress.percent === 100 ? 'var(--color-success)' : 'var(--color-accent)',
              boxShadow: 'none',
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
                  ? 'rgba(22, 163, 74, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: item.isComplete
                  ? '1px solid rgba(22, 163, 74, 0.5)'
                  : '1px solid rgba(112, 112, 128, 0.3)',
              }}
            >
              {item.isComplete && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5L4 7L8 3"
                    stroke="var(--color-accent)"
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
                color: item.isComplete ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                textDecoration: item.isComplete ? 'none' : 'none',
                fontFamily: "var(--font-sans)",
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
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <p
            className="text-xs font-medium"
            style={{
              color: 'var(--color-success)',
              fontFamily: "var(--font-sans)",
            }}
          >
            Pronto para publicar
          </p>
        </div>
      )}
    </div>
  );
}
