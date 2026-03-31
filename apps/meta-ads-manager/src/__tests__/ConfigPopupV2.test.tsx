import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigPopupV2 from '@/components/campaign-wizard/ConfigPopupV2';
import { useWizardStore } from '@/stores/wizard-store';

// Mock child components to isolate ConfigPopupV2 logic
jest.mock('@/components/campaign-wizard/ModeSelector', () => {
  return function MockModeSelector() {
    return <div data-testid="mode-selector">ModeSelector</div>;
  };
});
jest.mock('@/components/campaign-wizard/BatchCard', () => {
  return function MockBatchCard() {
    return <div data-testid="batch-card">BatchCard</div>;
  };
});
jest.mock('@/components/campaign-wizard/ChecklistSidebar', () => {
  return function MockChecklist() {
    return <div data-testid="checklist-sidebar">Checklist</div>;
  };
});
jest.mock('@/components/campaign-wizard/CreativePoolStep', () => {
  return function MockCreativePool() {
    return <div data-testid="creative-pool">CreativePool</div>;
  };
});
jest.mock('@/components/campaign-wizard/CampaignConfigStep', () => {
  return function MockCampaignConfig() {
    return <div data-testid="campaign-config">CampaignConfig</div>;
  };
});
jest.mock('@/components/campaign-wizard/AdCopyStep', () => {
  return function MockAdCopy() {
    return <div data-testid="ad-copy">AdCopy</div>;
  };
});
jest.mock('@/components/campaign-wizard/PreviewPublishStep', () => {
  return function MockPreviewPublish() {
    return <div data-testid="preview-publish">PreviewPublish</div>;
  };
});

beforeEach(() => {
  useWizardStore.getState().reset();
});

describe('ConfigPopupV2', () => {
  const defaultProps = {
    onClose: jest.fn(),
    onSaved: jest.fn(),
  };

  it('renders popup with header', () => {
    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByText('Configuracao de Campanha')).toBeInTheDocument();
  });

  it('renders ModeSelector on step 0', () => {
    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
  });

  it('renders all 6 step tabs', () => {
    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByText('Modo')).toBeInTheDocument();
    expect(screen.getByText('Lotes')).toBeInTheDocument();
    expect(screen.getByText('Criativos')).toBeInTheDocument();
    expect(screen.getByText('Campanha')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Publicar')).toBeInTheDocument();
  });

  it('shows step counter', () => {
    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByText(/Etapa 1 de 6/)).toBeInTheDocument();
  });

  it('disables "Voltar" button on step 0', () => {
    render(<ConfigPopupV2 {...defaultProps} />);
    const backButton = screen.getByText('Voltar');
    expect(backButton).toBeDisabled();
  });

  it('does not show checklist sidebar on step 0', () => {
    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.queryByTestId('checklist-sidebar')).not.toBeInTheDocument();
  });

  it('shows checklist sidebar on step 1+', () => {
    // Set mode and advance to step 1
    useWizardStore.getState().setMode('quick');
    useWizardStore.getState().setStep(1);

    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByTestId('checklist-sidebar')).toBeInTheDocument();
  });

  it('shows confirm close dialog when closing', () => {
    render(<ConfigPopupV2 {...defaultProps} />);
    // Click close button (the X)
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(screen.getByText('Sair da configuracao?')).toBeInTheDocument();
  });

  it('calls onClose after confirming close', () => {
    const onClose = jest.fn();
    render(<ConfigPopupV2 {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Fechar'));
    fireEvent.click(screen.getByText('Sair'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('loads draft state on mount', () => {
    const draftState = { mode: 'advanced' as const, currentStep: 2 };
    render(
      <ConfigPopupV2
        {...defaultProps}
        draftState={draftState}
        draftId="draft-123"
      />
    );

    const state = useWizardStore.getState();
    expect(state.isDraft).toBe(true);
    expect(state.draftId).toBe('draft-123');
  });

  it('loads template state on mount (resets first)', () => {
    // Set some state first
    useWizardStore.getState().setMode('quick');

    const templateState = { mode: 'advanced' as const };
    render(
      <ConfigPopupV2
        {...defaultProps}
        templateState={templateState}
      />
    );

    const state = useWizardStore.getState();
    expect(state.draftId).toBe('');
  });

  it('renders batch step content on step 1', () => {
    useWizardStore.getState().setMode('quick');
    useWizardStore.getState().setStep(1);

    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByText('Engenharia de Lotes')).toBeInTheDocument();
  });

  it('renders CreativePoolStep on step 2', () => {
    useWizardStore.getState().setMode('quick');
    useWizardStore.getState().setStep(2);

    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByTestId('creative-pool')).toBeInTheDocument();
  });

  it('renders CampaignConfigStep on step 3', () => {
    useWizardStore.getState().setMode('quick');
    useWizardStore.getState().setStep(3);

    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByTestId('campaign-config')).toBeInTheDocument();
  });

  it('renders AdCopyStep on step 4', () => {
    useWizardStore.getState().setMode('quick');
    useWizardStore.getState().setStep(4);

    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByTestId('ad-copy')).toBeInTheDocument();
  });

  it('renders PreviewPublishStep on step 5', () => {
    useWizardStore.getState().setMode('quick');
    useWizardStore.getState().setStep(5);

    render(<ConfigPopupV2 {...defaultProps} />);
    expect(screen.getByTestId('preview-publish')).toBeInTheDocument();
  });
});
