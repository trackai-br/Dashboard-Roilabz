import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BatchCard from '@/components/campaign-wizard/BatchCard';
import { useWizardStore } from '@/stores/wizard-store';
import type { BatchAdsetType } from '@/stores/wizard-store';

// Mock external hooks and API
jest.mock('@/hooks/useMetaAccounts', () => ({
  useMetaAccounts: () => ({
    data: [
      { meta_account_id: 'acc-1', meta_account_name: 'Conta Teste 1', currency: 'BRL' },
      { meta_account_id: 'acc-2', meta_account_name: 'Conta Teste 2', currency: 'USD' },
    ],
  }),
}));

jest.mock('@/hooks/useMetaPages', () => ({
  useMetaPages: (accountId: string | undefined) => ({
    data: accountId
      ? [
          { id: 'page-1', name: 'Pagina Teste 1' },
          { id: 'page-2', name: 'Pagina Teste 2' },
        ]
      : undefined,
  }),
}));

jest.mock('@/lib/api-client', () => ({
  authenticatedFetch: jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ pixels: [{ id: 'px-1', name: 'Pixel Principal' }] }),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

// Helper: reset store and add one batch, return it
const setupOneBatch = () => {
  useWizardStore.getState().reset();
  useWizardStore.getState().addBatch();
  return useWizardStore.getState().batches[0];
};

// Helper: reset and add two batches, return first
const setupTwoBatches = () => {
  useWizardStore.getState().reset();
  useWizardStore.getState().addBatch();
  useWizardStore.getState().addBatch();
  return useWizardStore.getState().batches[0];
};

const SAMPLE_ADSET: BatchAdsetType = {
  id: 'adset-test-1',
  name: 'Conjunto 1',
  adsetCount: 1,
  campaignsCount: 1,
  creativesInAdset: [],
  conversionLocation: 'WEBSITE',
  pixelId: '',
  conversionEvent: 'PURCHASE',
  startDate: '2026-04-01',
  targetCountries: ['BR'],
  adsetStatus: 'PAUSED',
};

describe('BatchCard — renderização base', () => {
  it('renderiza o nome do lote', () => {
    const batch = setupOneBatch();
    render(<BatchCard batch={batch} index={0} />, { wrapper: createWrapper() });
    expect(screen.getByDisplayValue(batch.name)).toBeInTheDocument();
  });

  it('renderiza badge "Incompleto" para lote sem configuração', () => {
    const batch = setupOneBatch();
    render(<BatchCard batch={batch} index={0} />, { wrapper: createWrapper() });
    expect(screen.getByText('Incompleto')).toBeInTheDocument();
  });

  it('mostra resumo com contadores quando colapsado', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: false });
    const collapsed = useWizardStore.getState().batches[0];
    render(<BatchCard batch={collapsed} index={0} />, { wrapper: createWrapper() });
    expect(screen.getByText(/0 conta/)).toBeInTheDocument();
  });
});

describe('BatchCard — conteúdo expandido', () => {
  it('mostra seção de contas quando expandido', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    expect(screen.getByText('Contas de Anuncio')).toBeInTheDocument();
    expect(screen.getByText('Conta Teste 1')).toBeInTheDocument();
    expect(screen.getByText('Conta Teste 2')).toBeInTheDocument();
  });

  it('não exibe páginas sem contas selecionadas', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    expect(screen.queryByText('Paginas Facebook')).not.toBeInTheDocument();
  });

  it('exibe páginas após selecionar uma conta', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().toggleBatchAccount(batch.id, {
      accountId: 'acc-1',
      accountName: 'Conta Teste 1',
      currency: 'BRL',
    });
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    expect(screen.getByText('Paginas Facebook')).toBeInTheDocument();
    expect(screen.getByText('Pagina Teste 1')).toBeInTheDocument();
    expect(screen.getByText('Pagina Teste 2')).toBeInTheDocument();
  });

  it('mostra seção de tipos de conjunto', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    expect(screen.getByText('Tipos de Conjunto (Ad Sets)')).toBeInTheDocument();
  });

  it('mostra seção de configuração de campanha', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    expect(screen.getByText('Configuracao da Campanha')).toBeInTheDocument();
  });

  it('mostra cálculo em tempo real', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText(/adsets totais/)).toBeInTheDocument();
  });
});

describe('BatchCard — seleção de contas', () => {
  it('clicar em conta a adiciona ao store', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Conta Teste 1'));
    expect(useWizardStore.getState().batches[0].accounts).toHaveLength(1);
    expect(useWizardStore.getState().batches[0].accounts[0].accountId).toBe('acc-1');
  });

  it('clicar na mesma conta duas vezes a remove', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().toggleBatchAccount(batch.id, {
      accountId: 'acc-1',
      accountName: 'Conta Teste 1',
      currency: 'BRL',
    });
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Conta Teste 1'));
    expect(useWizardStore.getState().batches[0].accounts).toHaveLength(0);
  });
});

describe('BatchCard — volume', () => {
  it('alterar número de campanhas atualiza o store', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    const [campaignsInput] = screen.getAllByRole('spinbutton');
    fireEvent.change(campaignsInput, { target: { value: '5' } });
    expect(useWizardStore.getState().batches[0].totalCampaigns).toBe(5);
  });

  it('alterar adsets por campanha respeita máximo de 250', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '300' } });
    expect(useWizardStore.getState().batches[0].adsetsPerCampaign).toBe(250);
  });
});

describe('BatchCard — ad sets', () => {
  it('exibe aviso quando não há ad sets', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    expect(screen.getByText(/Nenhum conjunto configurado/)).toBeInTheDocument();
  });

  it('clicar em Adicionar cria um ad set no store', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Adicionar'));
    expect(useWizardStore.getState().batches[0].adsetTypes).toHaveLength(1);
  });

  it('ad set criado aparece com nome e campos de configuração', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().addBatchAdsetType(batch.id, SAMPLE_ADSET);
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    expect(screen.getByDisplayValue('Conjunto 1')).toBeInTheDocument();
    expect(screen.getByText('Pixel')).toBeInTheDocument();
    expect(screen.getByText('Evento de Conversao')).toBeInTheDocument();
  });

  it('remover ad set elimina do store', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().addBatchAdsetType(batch.id, SAMPLE_ADSET);
    expect(useWizardStore.getState().batches[0].adsetTypes).toHaveLength(1);

    useWizardStore.getState().removeBatchAdsetType(batch.id, SAMPLE_ADSET.id);
    expect(useWizardStore.getState().batches[0].adsetTypes).toHaveLength(0);
  });
});

describe('BatchCard — configuração de campanha', () => {
  it('selecionar objetivo atualiza o store', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Vendas'));
    expect(useWizardStore.getState().batches[0].campaignConfig.objective).toBe('OUTCOME_SALES');
  });

  it('toggle ABO atualiza tipo de orçamento no store', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('ABO'));
    expect(useWizardStore.getState().batches[0].campaignConfig.budgetType).toBe('ABO');
  });

  it('status da campanha pode ser alternado para Ativo', () => {
    const batch = setupOneBatch();
    useWizardStore.getState().updateBatch(batch.id, { isExpanded: true });
    const expanded = useWizardStore.getState().batches[0];
    render(<BatchCard batch={expanded} index={0} />, { wrapper: createWrapper() });

    // "Ativo" buttons exist for both campaign status and adset status
    const activeButtons = screen.getAllByText('Ativo');
    fireEvent.click(activeButtons[0]);
    expect(useWizardStore.getState().batches[0].campaignConfig.campaignStatus).toBe('ACTIVE');
  });
});

describe('BatchCard — ações do card', () => {
  it('botão de remover ausente quando há apenas 1 lote', () => {
    const batch = setupOneBatch();
    render(<BatchCard batch={batch} index={0} />, { wrapper: createWrapper() });

    expect(screen.queryByTitle('Remover lote')).not.toBeInTheDocument();
  });

  it('botão de remover presente quando há mais de 1 lote', () => {
    const batch = setupTwoBatches();
    render(<BatchCard batch={batch} index={0} />, { wrapper: createWrapper() });

    expect(screen.getByTitle('Remover lote')).toBeInTheDocument();
  });

  it('duplicar lote cria novo lote no store', () => {
    const batch = setupOneBatch();
    const countBefore = useWizardStore.getState().batches.length;
    render(<BatchCard batch={batch} index={0} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByTitle('Duplicar lote'));
    expect(useWizardStore.getState().batches).toHaveLength(countBefore + 1);
  });

  it('remover lote elimina do store', () => {
    const batch = setupTwoBatches();
    const countBefore = useWizardStore.getState().batches.length;
    render(<BatchCard batch={batch} index={0} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByTitle('Remover lote'));
    expect(useWizardStore.getState().batches).toHaveLength(countBefore - 1);
  });
});
