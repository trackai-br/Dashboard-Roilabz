import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChecklistSidebar from '@/components/campaign-wizard/ChecklistSidebar';
import { useWizardStore } from '@/stores/wizard-store';

beforeEach(() => {
  useWizardStore.getState().reset();
});

describe('ChecklistSidebar', () => {
  it('renders checklist heading', () => {
    render(<ChecklistSidebar />);
    expect(screen.getByText('Checklist')).toBeInTheDocument();
  });

  it('renders all checklist items from store', () => {
    render(<ChecklistSidebar />);
    const state = useWizardStore.getState();
    for (const item of state.checklist) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it('shows 0% progress initially', () => {
    render(<ChecklistSidebar />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('updates progress when checklist items are completed', () => {
    const { checklist } = useWizardStore.getState();
    // Complete first item
    useWizardStore.getState().updateChecklistItem(checklist[0].id, true);

    render(<ChecklistSidebar />);
    // Should not be 0% anymore
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('shows "Pronto para publicar" when all items complete', () => {
    const { checklist } = useWizardStore.getState();
    for (const item of checklist) {
      useWizardStore.getState().updateChecklistItem(item.id, true);
    }

    render(<ChecklistSidebar />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Pronto para publicar')).toBeInTheDocument();
  });

  it('shows done/total count', () => {
    const { checklist } = useWizardStore.getState();
    render(<ChecklistSidebar />);
    expect(screen.getByText(`0/${checklist.length}`)).toBeInTheDocument();
  });
});
