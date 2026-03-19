import React from 'react';

type Step = 0 | 1 | 2 | 3 | 4 | 5;

interface WizardSidebarProps {
  currentStep: Step;
}

const steps = [
  { step: 0, label: 'Conta', icon: '🎯' },
  { step: 1, label: 'Assets', icon: '🎨' },
  { step: 2, label: 'Campanha', icon: '📊' },
  { step: 3, label: 'Ad Set', icon: '🎪' },
  { step: 4, label: 'Anúncio', icon: '📢' },
  { step: 5, label: 'Revisão', icon: '✓' },
];

export default function WizardSidebar({ currentStep }: WizardSidebarProps) {
  return (
    <div className="w-56 bg-white rounded-lg shadow-sm p-6 h-fit">
      <h3 className="text-lg font-semibold mb-6 text-gray-900">Wizard Setup</h3>
      <div className="space-y-3">
        {steps.map((item) => (
          <div
            key={item.step}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentStep === item.step
                ? 'bg-blue-50 border-l-4 border-blue-600'
                : currentStep > item.step
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
            {currentStep > item.step && <span className="ml-auto text-green-600">✓</span>}
            {currentStep === item.step && <span className="ml-auto animate-pulse">▶</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
