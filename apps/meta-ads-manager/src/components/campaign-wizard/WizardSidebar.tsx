import React from 'react';

interface WizardSidebarProps {
  currentStep: number;
}

const STEPS = [
  { id: 0, label: 'Account' },
  { id: 1, label: 'Assets' },
  { id: 2, label: 'Campaign' },
  { id: 3, label: 'Ad Set' },
  { id: 4, label: 'Ad' },
  { id: 5, label: 'Review' },
];

export function WizardSidebar({ currentStep }: WizardSidebarProps) {
  return (
    <div className="w-56 bg-white border-r border-gray-200 p-6">
      <h2 className="text-lg font-bold mb-8" style={{ color: 'var(--color-primary)' }}>
        Campaign Setup
      </h2>

      <div className="space-y-4">
        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                  isCompleted
                    ? 'bg-green-100 text-green-700'
                    : isCurrent
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : isCurrent ? '▶' : '○'}
              </div>
              <span
                className={`text-sm font-medium ${
                  isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-info-bg)' }}>
        <p className="text-xs" style={{ color: 'var(--color-info)' }}>
          📋 Follow each step to create and publish your campaign.
        </p>
      </div>
    </div>
  );
}
