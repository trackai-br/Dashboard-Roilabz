import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModeSelector from '@/components/campaign-wizard/ModeSelector';
import { useWizardStore } from '@/stores/wizard-store';

// Reset store between tests
beforeEach(() => {
  useWizardStore.getState().reset();
});

describe('ModeSelector', () => {
  it('renders all 3 mode options', () => {
    render(<ModeSelector />);
    expect(screen.getByText('Modo Rapido')).toBeInTheDocument();
    expect(screen.getByText('Modo Avancado')).toBeInTheDocument();
    expect(screen.getByText('Adicionar Adsets')).toBeInTheDocument();
  });

  it('shows "Recomendado" badge on quick mode', () => {
    render(<ModeSelector />);
    expect(screen.getByText('Recomendado')).toBeInTheDocument();
  });

  it('selects quick mode and advances to step 1', () => {
    render(<ModeSelector />);
    fireEvent.click(screen.getByText('Modo Rapido'));

    const state = useWizardStore.getState();
    expect(state.mode).toBe('quick');
    expect(state.currentStep).toBe(1);
    expect(state.completedSteps).toContain(0);
  });

  it('selects advanced mode and advances to step 1', () => {
    render(<ModeSelector />);
    fireEvent.click(screen.getByText('Modo Avancado'));

    const state = useWizardStore.getState();
    expect(state.mode).toBe('advanced');
    expect(state.currentStep).toBe(1);
  });

  it('selects add_adsets mode and advances to step 1', () => {
    render(<ModeSelector />);
    fireEvent.click(screen.getByText('Adicionar Adsets'));

    const state = useWizardStore.getState();
    expect(state.mode).toBe('add_adsets');
    expect(state.currentStep).toBe(1);
  });

  it('shows heading text', () => {
    render(<ModeSelector />);
    expect(screen.getByText('Como voce quer subir?')).toBeInTheDocument();
    expect(screen.getByText('Escolha o modo de configuracao das campanhas')).toBeInTheDocument();
  });
});
