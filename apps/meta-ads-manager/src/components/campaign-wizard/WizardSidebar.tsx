import React from 'react';

interface WizardSidebarProps {
  currentStep: number;
}

const STEPS = [
  { id: 0, label: 'Account', icon: '👤' },
  { id: 1, label: 'Assets', icon: '📊' },
  { id: 2, label: 'Campaign', icon: '📢' },
  { id: 3, label: 'Ad Set', icon: '🎯' },
  { id: 4, label: 'Ad', icon: '🖼️' },
  { id: 5, label: 'Review', icon: '✅' },
];

export function WizardSidebar({ currentStep }: WizardSidebarProps) {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', borderRightColor: 'rgba(57, 255, 20, 0.2)', borderRightWidth: '1px' }} className="w-56 p-6">
      <h2 className="text-lg font-bold mb-8" style={{ color: 'var(--neon-green)' }}>
        Campaign Setup
      </h2>

      <div className="space-y-4">
        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0"
                style={{
                  backgroundColor: isCompleted
                    ? 'var(--neon-green)'
                    : isCurrent
                    ? 'var(--neon-cyan)'
                    : 'rgba(57, 255, 20, 0.1)',
                  color: isCompleted || isCurrent ? '#000' : 'var(--color-secondary)',
                  borderColor: isCurrent ? 'var(--neon-cyan)' : 'transparent',
                  borderWidth: '2px',
                }}
              >
                {isCompleted ? '✓' : isCurrent ? step.icon : step.id}
              </div>
              <span
                className="text-sm font-medium transition"
                style={{
                  color: isCurrent ? 'var(--neon-green)' : isCompleted ? 'var(--neon-green)' : 'var(--color-secondary)',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-lg border border-cyan-500/30" style={{ backgroundColor: 'rgba(0, 212, 255, 0.05)' }}>
        <p className="text-xs" style={{ color: 'var(--neon-cyan)' }}>
          📋 Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
