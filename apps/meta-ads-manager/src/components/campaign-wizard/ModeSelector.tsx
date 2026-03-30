import React from 'react';
import { useWizardStore, selectMode } from '@/stores/wizard-store';
import type { WizardMode } from '@/stores/wizard-store';

interface ModeOption {
  id: WizardMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const MODES: ModeOption[] = [
  {
    id: 'quick',
    title: 'Modo Rapido',
    description: 'Um lote unico. Ideal para subidas simples com uma configuracao padrao.',
    badge: 'Recomendado',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: 'advanced',
    title: 'Modo Avancado',
    description: 'Multiplos lotes com configs independentes. Contas, paginas, budget e adsets por lote.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
  },
  {
    id: 'add_adsets',
    title: 'Adicionar Adsets',
    description: 'Adicionar novos conjuntos a campanhas existentes. Nao cria novas campanhas.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function ModeSelector() {
  const mode = useWizardStore(selectMode);
  const setMode = useWizardStore((s) => s.setMode);
  const setStep = useWizardStore((s) => s.setStep);
  const markStepComplete = useWizardStore((s) => s.markStepComplete);

  const handleSelect = (selectedMode: WizardMode) => {
    setMode(selectedMode);
    markStepComplete(0);
    setStep(1);
  };

  return (
    <div>
      <h3
        className="text-lg font-bold mb-1"
        style={{
          color: 'var(--color-primary)',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}
      >
        Como voce quer subir?
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--color-secondary)' }}>
        Escolha o modo de configuracao das campanhas
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODES.map((option) => {
          const isSelected = mode === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="relative p-6 rounded-xl border text-left transition-all duration-200 group"
              style={{
                backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                borderColor: isSelected ? 'rgba(57, 255, 20, 0.5)' : 'rgba(57, 255, 20, 0.1)',
                boxShadow: isSelected ? '0 0 20px rgba(57, 255, 20, 0.15)' : 'none',
              }}
            >
              {option.badge && (
                <span
                  className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(57, 255, 20, 0.15)',
                    color: 'var(--neon-green)',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    letterSpacing: '0.05em',
                  }}
                >
                  {option.badge}
                </span>
              )}

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{
                  backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? 'var(--neon-green)' : 'var(--color-secondary)',
                }}
              >
                {option.icon}
              </div>

              <h4
                className="text-sm font-semibold mb-2"
                style={{
                  color: isSelected ? 'var(--neon-green)' : 'var(--color-primary)',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  letterSpacing: '0.03em',
                }}
              >
                {option.title}
              </h4>

              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--color-tertiary)' }}
              >
                {option.description}
              </p>

              {isSelected && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
                  style={{
                    backgroundColor: 'var(--neon-green)',
                    boxShadow: '0 0 8px rgba(57, 255, 20, 0.5)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
