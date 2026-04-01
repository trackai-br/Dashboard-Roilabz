import { z } from 'zod';

// --- Sub-schemas ---

export const BatchAccountEntrySchema = z.object({
  accountId: z.string().min(1, 'ID da conta obrigatório'),
  accountName: z.string(),
  currency: z.string(),
});

export const BatchPageEntrySchema = z.object({
  pageId: z.string().min(1, 'ID da página obrigatório'),
  pageName: z.string(),
  accountId: z.string(),
});

export const BatchAdsetTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nome do conjunto obrigatório'),
  adsetCount: z.number().int().min(1, 'Mínimo 1 adset'),
  campaignsCount: z.number().int().min(1),
  creativesInAdset: z.array(z.string()),
  conversionLocation: z.string().min(1, 'Local de conversão obrigatório'),
  bidCapValue: z.number().optional(),
  pixelId: z.string().min(1, 'Pixel obrigatório'),
  conversionEvent: z.string().min(1, 'Evento de conversão obrigatório'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  targetCountries: z.array(z.string().length(2)).min(1, 'Pelo menos 1 país obrigatório'),
  adsetStatus: z.enum(['ACTIVE', 'PAUSED']),
});

export const BatchCampaignConfigSchema = z.object({
  objective: z.string().min(1, 'Objetivo da campanha obrigatório'),
  namingPattern: z.object({
    levaNumber: z.string().min(1, 'Número da leva obrigatório'),
    creativeLabel: z.string().min(1, 'Label do criativo obrigatório'),
  }),
  namingTags: z.array(z.any()),
  budgetType: z.enum(['CBO', 'ABO']),
  budgetValue: z.number().int().min(1, 'Orçamento deve ser maior que 0'),
  bidStrategy: z.string().min(1, 'Estratégia de lance obrigatória'),
  campaignStatus: z.enum(['ACTIVE', 'PAUSED']),
});

export const BatchConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nome do lote obrigatório'),
  accounts: z.array(BatchAccountEntrySchema).min(1, 'Selecione pelo menos 1 conta'),
  pages: z.array(BatchPageEntrySchema).min(1, 'Selecione pelo menos 1 página'),
  adsetsPerCampaign: z.number().int().min(1).max(250),
  totalCampaigns: z.number().int().min(1, 'Mínimo 1 campanha'),
  campaignConfig: BatchCampaignConfigSchema,
  adsetTypes: z.array(BatchAdsetTypeSchema).min(1, 'Configure pelo menos 1 tipo de conjunto'),
  isExpanded: z.boolean(),
  isComplete: z.boolean(),
}).superRefine((batch, ctx) => {
  // Bid cap required for strategies that need it
  const bidCapStrategies = ['LOWEST_COST_WITH_BID_CAP', 'COST_CAP'];
  if (bidCapStrategies.includes(batch.campaignConfig.bidStrategy)) {
    const missing = batch.adsetTypes.filter((a) => !a.bidCapValue);
    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['campaignConfig', 'bidStrategy'],
        message: `Estratégia "${batch.campaignConfig.bidStrategy}" exige bid cap em todos os conjuntos`,
      });
    }
  }
});

// --- Validation helper ---

export interface BatchValidationResult {
  isValid: boolean;
  errors: Record<string, string>;   // field path → message
  warnings: string[];
}

export function validateBatch(batch: unknown): BatchValidationResult {
  const result = BatchConfigSchema.safeParse(batch);

  if (result.success) {
    const data = result.data;
    const warnings: string[] = [];

    // High budget warning (value in centavos)
    const totalCampaigns = data.totalCampaigns;
    const adsetsPerCampaign = data.adsetsPerCampaign;
    const budgetCents = data.campaignConfig.budgetValue;
    const totalBudget = data.campaignConfig.budgetType === 'CBO'
      ? (budgetCents / 100) * totalCampaigns
      : (budgetCents / 100) * (totalCampaigns * adsetsPerCampaign);

    if (totalBudget > 50000) {
      warnings.push(`Orçamento total (R$ ${totalBudget.toFixed(2)}) excede R$ 50.000`);
    }

    // ROAS not supported
    if (data.campaignConfig.bidStrategy === 'LOWEST_COST_WITH_MIN_ROAS') {
      warnings.push('Estratégia ROAS mínimo não suportada — será usado custo mais baixo automaticamente');
    }

    return { isValid: true, errors: {}, warnings };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { isValid: false, errors, warnings: [] };
}

export function validateAllBatches(batches: unknown[]): {
  isValid: boolean;
  batchErrors: Array<{ batchIndex: number; errors: Record<string, string> }>;
} {
  const batchErrors: Array<{ batchIndex: number; errors: Record<string, string> }> = [];

  batches.forEach((batch, index) => {
    const result = validateBatch(batch);
    if (!result.isValid) {
      batchErrors.push({ batchIndex: index, errors: result.errors });
    }
  });

  return { isValid: batchErrors.length === 0, batchErrors };
}
