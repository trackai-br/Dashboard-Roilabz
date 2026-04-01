/**
 * Regras da Meta API para construção de payloads de campanha e adset.
 *
 * BR-014: OUTCOME_SALES sem pixel → LINK_CLICKS (não OFFSITE_CONVERSIONS)
 * BR-015: OUTCOME_TRAFFIC sem pixel → LINK_CLICKS
 * BR-016: OUTCOME_AWARENESS sem pixel → REACH
 * BR-017: OUTCOME_ENGAGEMENT sem pixel → POST_ENGAGEMENT
 * BR-018: OUTCOME_LEADS sem pixel → LEAD_GENERATION
 * BR-019: OUTCOME_APP_PROMOTION sem pixel → APP_INSTALLS
 * BR-020: pixel (qualquer bid strategy) → OFFSITE_CONVERSIONS + promoted_object completo
 *         sem pixel → objetivo mapeado por getOptimizationGoalForObjective
 *         NOTA: LOWEST_COST_WITHOUT_CAP com pixel ainda exige OFFSITE_CONVERSIONS;
 *         a diferença é que bid_strategy deve ser enviado EXPLICITAMENTE (não omitido).
 *         Meta API v23.0 + OUTCOME_SALES: omitir bid_strategy causa Meta assumir ROAS → erro 2490487
 * BR-021: objetivo desconhecido sem pixel → LINK_CLICKS (fallback seguro)
 * BR-022: LOWEST_COST_WITHOUT_CAP → bid_strategy EXPLÍCITO no payload (não omitido)
 * BR-023: LOWEST_COST_WITH_BID_CAP + bidCapValue → bid_strategy + bid_amount
 * BR-024: LOWEST_COST_WITH_BID_CAP sem bidCapValue → bid_strategy ausente
 * BR-025: COST_CAP + bidCapValue → bid_strategy + bid_amount
 * BR-026: CBO → daily_budget na campanha, ausente no adset
 * BR-027: ABO → daily_budget no adset, ausente na campanha
 */

const OBJECTIVE_TO_OPTIMIZATION_GOAL: Record<string, string> = {
  OUTCOME_SALES: 'LINK_CLICKS',
  OUTCOME_TRAFFIC: 'LINK_CLICKS',
  OUTCOME_AWARENESS: 'REACH',
  OUTCOME_ENGAGEMENT: 'POST_ENGAGEMENT',
  OUTCOME_LEADS: 'LEAD_GENERATION',
  OUTCOME_APP_PROMOTION: 'APP_INSTALLS',
};

/**
 * Retorna o optimization_goal para um objetivo SEM pixel.
 * Com pixel, use buildAdsetPayloadExtras (sempre OFFSITE_CONVERSIONS).
 */
export function getOptimizationGoalForObjective(objective: string): string {
  return OBJECTIVE_TO_OPTIMIZATION_GOAL[objective] ?? 'LINK_CLICKS';
}

export interface BuildAdsetExtrasInput {
  objective: string;
  pixelId?: string;
  conversionEvent?: string;
  bidStrategy: string;
  bidCapValue?: number;
  budgetType?: 'CBO' | 'ABO';
  budgetValue?: number;
}

export interface AdsetPayloadExtras {
  optimization_goal: string;
  promoted_object?: { pixel_id: string; custom_event_type: string };
  bid_strategy?: string;
  bid_amount?: number;
  daily_budget?: number;
}

/**
 * Constrói os campos extras do payload de adset:
 * - optimization_goal (com ou sem pixel)
 * - promoted_object (apenas quando há pixel)
 * - bid_strategy / bid_amount (conforme estratégia)
 * - daily_budget (apenas ABO)
 */
export function buildAdsetPayloadExtras(input: BuildAdsetExtrasInput): AdsetPayloadExtras {
  const { objective, pixelId, conversionEvent, bidStrategy, bidCapValue, budgetType, budgetValue } = input;

  // BR-020: pixel presente → sempre OFFSITE_CONVERSIONS + promoted_object,
  // independente da bid strategy. Sem pixel → objetivo mapeado.
  const result: AdsetPayloadExtras = {
    optimization_goal: pixelId
      ? 'OFFSITE_CONVERSIONS'
      : getOptimizationGoalForObjective(objective),
  };

  if (pixelId && conversionEvent) {
    result.promoted_object = {
      pixel_id: pixelId as string,
      custom_event_type: conversionEvent,
    };
  }

  // BR-022: LOWEST_COST_WITHOUT_CAP → bid_strategy EXPLÍCITO (não omitido).
  //         Meta API v23.0 + OUTCOME_SALES: omitir bid_strategy faz Meta assumir ROAS
  //         internamente → erro 2490487 mesmo sem bid_amount no payload.
  // BR-023: LOWEST_COST_WITH_BID_CAP + bidCapValue > 0 → bid_strategy + bid_amount
  // BR-024: LOWEST_COST_WITH_BID_CAP sem bidCapValue → bid_strategy ausente
  // BR-025: COST_CAP + bidCapValue > 0 → bid_strategy + bid_amount
  if (bidStrategy === 'LOWEST_COST_WITHOUT_CAP') {
    result.bid_strategy = 'LOWEST_COST_WITHOUT_CAP';
  } else if (
    (bidStrategy === 'LOWEST_COST_WITH_BID_CAP' || bidStrategy === 'COST_CAP') &&
    bidCapValue != null && bidCapValue > 0
  ) {
    result.bid_strategy = bidStrategy;
    result.bid_amount = bidCapValue;
  }

  // BR-027: ABO → daily_budget no adset
  // BR-026: CBO → daily_budget ausente no adset
  if (budgetType === 'ABO' && budgetValue != null && budgetValue > 0) {
    result.daily_budget = budgetValue;
  }

  return result;
}

export interface CampaignPayloadExtras {
  daily_budget?: number;
}

/**
 * Constrói os campos extras do payload de campanha:
 * - daily_budget apenas para CBO
 */
export function buildCampaignPayloadExtras(input: {
  budgetType: 'CBO' | 'ABO';
  budgetValue: number;
}): CampaignPayloadExtras {
  if (input.budgetType === 'CBO') {
    return { daily_budget: input.budgetValue };
  }
  return {};
}
