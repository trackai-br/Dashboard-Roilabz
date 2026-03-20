import type { DistributionEntry } from '@/contexts/WizardContext';

const MAX_ADSETS_PER_PAGE = 250;

interface PageInfo {
  id: string;
  name: string;
  activeAdsets: number;
}

interface AccountInfo {
  id: string;
  name: string;
}

interface DistributionParams {
  selectedAccounts: AccountInfo[];
  selectedPages: PageInfo[];
  adsetsPerCampaign: number;
  totalCampaigns: number;
}

interface DistributionResult {
  distribution: DistributionEntry[];
  errors: string[];
}

export function calculateDistribution(params: DistributionParams): DistributionResult {
  const { selectedAccounts, selectedPages, adsetsPerCampaign, totalCampaigns } = params;
  const errors: string[] = [];
  const distribution: DistributionEntry[] = [];

  if (selectedAccounts.length === 0) {
    errors.push('Nenhuma conta selecionada.');
    return { distribution, errors };
  }

  if (selectedPages.length === 0) {
    errors.push('Nenhuma página selecionada.');
    return { distribution, errors };
  }

  if (adsetsPerCampaign <= 0 || totalCampaigns <= 0) {
    errors.push('Volume inválido.');
    return { distribution, errors };
  }

  // Build available slots per page
  const pageSlots = selectedPages
    .map((p) => ({
      ...p,
      available: MAX_ADSETS_PER_PAGE - p.activeAdsets,
    }))
    .filter((p) => p.available >= adsetsPerCampaign);

  if (pageSlots.length === 0) {
    errors.push(
      `Nenhuma página tem slots suficientes para ${adsetsPerCampaign} adsets. ` +
      `Reduza o número de adsets por campanha ou selecione páginas com menos adsets ativos.`
    );
    return { distribution, errors };
  }

  // Track remaining slots per page
  const remainingSlots = new Map<string, number>();
  pageSlots.forEach((p) => remainingSlots.set(p.id, p.available));

  // Distribute campaigns round-robin across accounts
  let campaignsAllocated = 0;

  for (let i = 0; i < totalCampaigns; i++) {
    const accountIndex = i % selectedAccounts.length;
    const account = selectedAccounts[accountIndex];

    // Find a page with enough slots
    let assigned = false;
    for (const page of pageSlots) {
      const remaining = remainingSlots.get(page.id) || 0;
      if (remaining >= adsetsPerCampaign) {
        distribution.push({
          campaignIndex: i + 1,
          accountId: account.id,
          pageId: page.id,
          pageName: page.name,
          adsetCount: adsetsPerCampaign,
        });
        remainingSlots.set(page.id, remaining - adsetsPerCampaign);
        campaignsAllocated++;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const unallocated = totalCampaigns - campaignsAllocated;
      errors.push(
        `Não foi possível alocar ${unallocated} campanha(s). ` +
        `Faltam páginas com slots disponíveis. Selecione mais páginas ou reduza o volume.`
      );
      break;
    }
  }

  return { distribution, errors };
}
