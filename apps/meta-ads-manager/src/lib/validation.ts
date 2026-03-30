import type { WizardState } from '@/contexts/WizardContext';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export function validateWizardState(state: WizardState): {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // --- Errors (block publication) ---

  // Tab 1: Accounts
  if (state.selectedAccountIds.length === 0) {
    errors.push({ field: 'accounts', message: 'Nenhuma conta selecionada' });
  }

  // Tab 2: Pages & Volume
  if (state.selectedPageIds.length === 0) {
    errors.push({ field: 'pages', message: 'Nenhuma pagina selecionada' });
  }
  if (state.adsetsPerCampaign <= 0) {
    errors.push({ field: 'adsetsPerCampaign', message: 'Numero de adsets por campanha deve ser maior que 0' });
  }
  if (state.totalCampaigns <= 0) {
    errors.push({ field: 'totalCampaigns', message: 'Numero de campanhas deve ser maior que 0' });
  }
  if (state.distributionMap.length === 0 && state.selectedPageIds.length > 0) {
    errors.push({ field: 'distribution', message: 'Distribuicao nao calculada' });
  }

  // Tab 3: Campaign Config
  const cfg = state.campaignConfig;
  if (!cfg.objective) {
    errors.push({ field: 'objective', message: 'Objetivo da campanha nao definido' });
  }
  if (!cfg.namingPattern.levaNumber) {
    errors.push({ field: 'namingPattern.levaNumber', message: 'Numero da leva nao preenchido' });
  }
  if (!cfg.namingPattern.creativeLabel) {
    errors.push({ field: 'namingPattern.creativeLabel', message: 'Identificacao do criativo nao preenchida' });
  }
  if (cfg.budgetValue <= 0) {
    errors.push({ field: 'budgetValue', message: 'Orcamento deve ser maior que 0' });
  }
  if (!cfg.bidStrategy) {
    errors.push({ field: 'bidStrategy', message: 'Estrategia de lance nao definida' });
  }

  // Bid strategy requires bid_amount
  if (['LOWEST_COST_WITH_BID_CAP', 'COST_CAP'].includes(cfg.bidStrategy)) {
    const missingBidCap = state.adsetTypes.some((t) => !t.bidCapValue);
    if (missingBidCap) {
      errors.push({
        field: 'bidCapValue',
        message: `Estrategia "${cfg.bidStrategy}" exige valor de lance (bid cap) em todos os tipos de adset`,
      });
    }
  }

  // ROAS strategy not implemented
  if (cfg.bidStrategy === 'LOWEST_COST_WITH_MIN_ROAS') {
    warnings.push({
      field: 'bidStrategy',
      message: 'Estrategia ROAS minimo nao suportada — sera usado custo mais baixo automaticamente',
    });
  }

  // Tab 4: Adset Types
  if (state.adsetTypes.length === 0) {
    errors.push({ field: 'adsetTypes', message: 'Nenhum tipo de adset configurado' });
  }

  const totalConfigured = state.adsetTypes.reduce((sum, t) => sum + t.adsetCount * t.campaignsCount, 0);
  const totalProgrammed = state.adsetsPerCampaign * state.totalCampaigns;
  if (state.adsetTypes.length > 0 && totalConfigured !== totalProgrammed) {
    errors.push({
      field: 'adsetTypes.volume',
      message: `Total de adsets dos tipos (${totalConfigured}) diferente do total programado (${totalProgrammed})`,
    });
  }

  for (const t of state.adsetTypes) {
    if (!t.name) errors.push({ field: `adsetType.${t.id}.name`, message: `Tipo de adset sem nome` });
    if (!t.pixelId) errors.push({ field: `adsetType.${t.id}.pixelId`, message: `Tipo "${t.name || 'sem nome'}" sem pixel` });
    if (!t.conversionEvent) errors.push({ field: `adsetType.${t.id}.conversionEvent`, message: `Tipo "${t.name || 'sem nome'}" sem evento de conversao` });
    if (!t.startDate) errors.push({ field: `adsetType.${t.id}.startDate`, message: `Tipo "${t.name || 'sem nome'}" sem data de inicio` });
    if (t.targetCountries.length === 0) errors.push({ field: `adsetType.${t.id}.targetCountries`, message: `Tipo "${t.name || 'sem nome'}" sem pais alvo` });
  }

  // Tab 5: Ad Config
  const ad = state.adConfig;
  if (!ad || !ad.destinationUrl) {
    errors.push({ field: 'destinationUrl', message: 'URL de destino nao configurada' });
  } else if (!ad.destinationUrl.startsWith('http://') && !ad.destinationUrl.startsWith('https://')) {
    errors.push({ field: 'destinationUrl', message: 'URL de destino invalida (deve comecar com http:// ou https://)' });
  }
  if (!ad || ad.creativeFiles.length === 0) {
    errors.push({ field: 'creativeFiles', message: 'Nenhum criativo listado' });
  }
  if (!ad?.primaryText) {
    errors.push({ field: 'primaryText', message: 'Texto principal do anuncio nao preenchido' });
  }
  if (!ad?.headline) {
    errors.push({ field: 'headline', message: 'Titulo do anuncio nao preenchido' });
  }

  // --- Warnings (don't block) ---

  // Video creatives warning
  if (ad && ad.creativeFiles.length > 0) {
    const videoFiles = ad.creativeFiles.filter((f) => f.type === 'video');
    if (videoFiles.length > 0) {
      warnings.push({
        field: 'videoCreatives',
        message: `${videoFiles.length} criativo(s) de video serao ignorados (upload de video nao implementado): ${videoFiles.map((f) => f.fileName).join(', ')}`,
      });
    }
  }

  // Creative mismatch
  if (ad && ad.creativeFiles.length > 0) {
    const fileNames = new Set(ad.creativeFiles.map((f) => f.fileName));
    const adsetCreativeNames = new Set(
      state.adsetTypes.flatMap((t) => t.creativesInAdset).filter(Boolean)
    );
    for (const name of adsetCreativeNames) {
      if (!fileNames.has(name)) {
        warnings.push({
          field: 'creativeMismatch',
          message: `Criativo "${name}" referenciado nos adsets mas nao encontrado nos arquivos`,
        });
      }
    }
  }

  // High budget threshold
  const budgetDisplay = cfg.budgetValue / 100;
  const totalBudget = cfg.budgetType === 'CBO'
    ? budgetDisplay * state.totalCampaigns
    : budgetDisplay * totalProgrammed;
  if (totalBudget > 50000) {
    warnings.push({
      field: 'budgetHigh',
      message: `Orcamento total programado (R$ ${totalBudget.toFixed(2)}) excede R$ 50.000`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
