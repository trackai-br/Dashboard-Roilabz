/**
 * TDD — Regras da Meta API para Adsets e Campanhas
 *
 * Regras de negócio testadas:
 * BR-014: OUTCOME_SALES sem pixel → LINK_CLICKS (não OFFSITE_CONVERSIONS)
 * BR-015: OUTCOME_TRAFFIC sem pixel → LINK_CLICKS
 * BR-016: OUTCOME_AWARENESS sem pixel → REACH
 * BR-017: OUTCOME_ENGAGEMENT sem pixel → POST_ENGAGEMENT
 * BR-018: OUTCOME_LEADS sem pixel → LEAD_GENERATION
 * BR-019: OUTCOME_APP_PROMOTION sem pixel → APP_INSTALLS
 * BR-020: pixel + BID_CAP/COST_CAP → OFFSITE_CONVERSIONS + promoted_object
 *         pixel + LOWEST_COST_WITHOUT_CAP → objetivo mapeado (sem OFFSITE_CONVERSIONS)
 *         Meta API v23.0 rejeita OFFSITE_CONVERSIONS sem bid constraints explícitas
 * BR-021: objetivo desconhecido sem pixel → LINK_CLICKS (fallback seguro)
 * BR-022: LOWEST_COST_WITHOUT_CAP → bid_strategy ausente no payload
 * BR-023: LOWEST_COST_WITH_BID_CAP + bidCapValue → bid_strategy + bid_amount
 * BR-024: LOWEST_COST_WITH_BID_CAP sem bidCapValue → bid_strategy ausente
 * BR-025: COST_CAP + bidCapValue → bid_strategy + bid_amount
 * BR-026: CBO → daily_budget na campanha, ausente no adset
 * BR-027: ABO → daily_budget no adset, ausente na campanha
 */

import {
  getOptimizationGoalForObjective,
  buildAdsetPayloadExtras,
  buildCampaignPayloadExtras,
} from '@/lib/meta-ad-rules';

// --- BR-014 a BR-021: getOptimizationGoalForObjective (sem pixel) ---

describe('getOptimizationGoalForObjective — fallback sem pixel', () => {
  it('BR-014: OUTCOME_SALES → LINK_CLICKS (não OFFSITE_CONVERSIONS)', () => {
    expect(getOptimizationGoalForObjective('OUTCOME_SALES')).toBe('LINK_CLICKS');
  });

  it('BR-015: OUTCOME_TRAFFIC → LINK_CLICKS', () => {
    expect(getOptimizationGoalForObjective('OUTCOME_TRAFFIC')).toBe('LINK_CLICKS');
  });

  it('BR-016: OUTCOME_AWARENESS → REACH', () => {
    expect(getOptimizationGoalForObjective('OUTCOME_AWARENESS')).toBe('REACH');
  });

  it('BR-017: OUTCOME_ENGAGEMENT → POST_ENGAGEMENT', () => {
    expect(getOptimizationGoalForObjective('OUTCOME_ENGAGEMENT')).toBe('POST_ENGAGEMENT');
  });

  it('BR-018: OUTCOME_LEADS → LEAD_GENERATION', () => {
    expect(getOptimizationGoalForObjective('OUTCOME_LEADS')).toBe('LEAD_GENERATION');
  });

  it('BR-019: OUTCOME_APP_PROMOTION → APP_INSTALLS', () => {
    expect(getOptimizationGoalForObjective('OUTCOME_APP_PROMOTION')).toBe('APP_INSTALLS');
  });

  it('BR-021: objetivo desconhecido → LINK_CLICKS (fallback seguro)', () => {
    expect(getOptimizationGoalForObjective('OBJECTIVE_INEXISTENTE')).toBe('LINK_CLICKS');
    expect(getOptimizationGoalForObjective('')).toBe('LINK_CLICKS');
  });

  it('REGRESSÃO BUG-2490487: OUTCOME_SALES NÃO deve retornar OFFSITE_CONVERSIONS sem pixel', () => {
    // Bug original: sem pixel + OUTCOME_SALES → OFFSITE_CONVERSIONS (requer pixel) → erro 2490487
    expect(getOptimizationGoalForObjective('OUTCOME_SALES')).not.toBe('OFFSITE_CONVERSIONS');
  });
});

// --- BR-020: buildAdsetPayloadExtras com pixel ---

describe('buildAdsetPayloadExtras — optimization_goal com pixel', () => {
  // pixel + BID_CAP/COST_CAP → OFFSITE_CONVERSIONS (constraints explícitas fornecidas)
  it('BR-020: pixel + LOWEST_COST_WITH_BID_CAP → OFFSITE_CONVERSIONS', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_123',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
      bidCapValue: 500,
    });
    expect(result.optimization_goal).toBe('OFFSITE_CONVERSIONS');
  });

  it('BR-020: pixel + COST_CAP → OFFSITE_CONVERSIONS', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_123',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'COST_CAP',
      bidCapValue: 500,
    });
    expect(result.optimization_goal).toBe('OFFSITE_CONVERSIONS');
  });

  it('BR-020: pixel + BID_CAP → promoted_object com pixel_id e custom_event_type', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_123',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
      bidCapValue: 500,
    });
    expect(result.promoted_object).toEqual({
      pixel_id: 'px_123',
      custom_event_type: 'PURCHASE',
    });
  });

  it('BR-020: pixel + BID_CAP → funciona para qualquer objetivo', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      pixelId: 'px_abc',
      conversionEvent: 'LEAD',
      bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
      bidCapValue: 300,
    });
    expect(result.optimization_goal).toBe('OFFSITE_CONVERSIONS');
    expect(result.promoted_object?.pixel_id).toBe('px_abc');
  });

  // pixel + LOWEST_COST_WITHOUT_CAP → objetivo mapeado (sem OFFSITE_CONVERSIONS)
  it('BR-020: pixel + LOWEST_COST_WITHOUT_CAP → objetivo mapeado (não OFFSITE_CONVERSIONS)', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_123',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    });
    expect(result.optimization_goal).toBe('LINK_CLICKS');
  });

  it('BR-020: pixel + LOWEST_COST_WITHOUT_CAP → promoted_object ausente', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_123',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    });
    expect(result.promoted_object).toBeUndefined();
  });

  it('sem pixel → promoted_object ausente no payload', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    });
    expect(result.promoted_object).toBeUndefined();
  });

  it('REGRESSÃO BUG-2490487-V2: LOWEST_COST_WITHOUT_CAP + pixel NÃO deve usar OFFSITE_CONVERSIONS', () => {
    // Bug: Meta API v23.0 rejeita OFFSITE_CONVERSIONS sem bid constraints → erro 2490487
    // Apenas BID_CAP/COST_CAP podem usar OFFSITE_CONVERSIONS (pois fornecem bid_amount)
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_real',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    });
    expect(result.optimization_goal).not.toBe('OFFSITE_CONVERSIONS');
    expect(result.optimization_goal).toBe('LINK_CLICKS');
    expect(result.promoted_object).toBeUndefined();
  });
});

// --- optimization_goal sempre presente ---

describe('buildAdsetPayloadExtras — optimization_goal sempre presente', () => {
  it('optimization_goal nunca é undefined (com pixel)', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_1',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    });
    expect(result.optimization_goal).toBeDefined();
    expect(result.optimization_goal.length).toBeGreaterThan(0);
  });

  it('optimization_goal nunca é undefined (sem pixel, todos os objetivos)', () => {
    const objectives = [
      'OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS',
      'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION',
    ];
    objectives.forEach((obj) => {
      const result = buildAdsetPayloadExtras({ objective: obj, bidStrategy: 'LOWEST_COST_WITHOUT_CAP' });
      expect(result.optimization_goal).toBeDefined();
    });
  });
});

// --- BR-022 a BR-025: bid_strategy no payload ---

describe('buildAdsetPayloadExtras — bid_strategy', () => {
  it('BR-022: LOWEST_COST_WITHOUT_CAP → bid_strategy ausente no payload', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    });
    expect(result.bid_strategy).toBeUndefined();
    expect(result.bid_amount).toBeUndefined();
  });

  it('BR-023: LOWEST_COST_WITH_BID_CAP com bidCapValue → bid_strategy + bid_amount enviados', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
      bidCapValue: 500,
    });
    expect(result.bid_strategy).toBe('LOWEST_COST_WITH_BID_CAP');
    expect(result.bid_amount).toBe(500);
  });

  it('BR-024: LOWEST_COST_WITH_BID_CAP sem bidCapValue → bid_strategy ausente', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
      bidCapValue: undefined,
    });
    expect(result.bid_strategy).toBeUndefined();
  });

  it('BR-024: LOWEST_COST_WITH_BID_CAP com bidCapValue=0 → bid_strategy ausente (0 não é valor válido)', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
      bidCapValue: 0,
    });
    expect(result.bid_strategy).toBeUndefined();
  });

  it('BR-025: COST_CAP com bidCapValue → bid_strategy + bid_amount enviados', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'COST_CAP',
      bidCapValue: 300,
    });
    expect(result.bid_strategy).toBe('COST_CAP');
    expect(result.bid_amount).toBe(300);
  });

  it('LOWEST_COST_WITH_MIN_ROAS → bid_strategy ausente (não implementado, cai no default)', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      bidStrategy: 'LOWEST_COST_WITH_MIN_ROAS',
    });
    expect(result.bid_strategy).toBeUndefined();
  });
});

// --- BR-026 e BR-027: budget placement ---

describe('buildCampaignPayloadExtras — CBO vs ABO', () => {
  it('BR-026: CBO → daily_budget presente na campanha', () => {
    const result = buildCampaignPayloadExtras({ budgetType: 'CBO', budgetValue: 5000 });
    expect(result.daily_budget).toBe(5000);
  });

  it('BR-027: ABO → daily_budget ausente na campanha', () => {
    const result = buildCampaignPayloadExtras({ budgetType: 'ABO', budgetValue: 5000 });
    expect(result.daily_budget).toBeUndefined();
  });
});

describe('buildAdsetPayloadExtras — CBO vs ABO no adset', () => {
  it('BR-026: CBO → daily_budget ausente no adset', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetType: 'CBO',
      budgetValue: 5000,
    });
    expect(result.daily_budget).toBeUndefined();
  });

  it('BR-027: ABO → daily_budget presente no adset', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetType: 'ABO',
      budgetValue: 5000,
    });
    expect(result.daily_budget).toBe(5000);
  });

  it('orçamento indefinido → daily_budget ausente no adset independente do tipo', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      // budgetType e budgetValue omitidos
    });
    expect(result.daily_budget).toBeUndefined();
  });
});

// --- Testes combinados (integração das regras) ---

describe('buildAdsetPayloadExtras — combinações reais', () => {
  it('OUTCOME_SALES + pixel + BidCap → payload completo correto', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_real',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
      bidCapValue: 1000,
      budgetType: 'ABO',
      budgetValue: 5000,
    });
    expect(result.optimization_goal).toBe('OFFSITE_CONVERSIONS');
    expect(result.promoted_object?.pixel_id).toBe('px_real');
    expect(result.bid_strategy).toBe('LOWEST_COST_WITH_BID_CAP');
    expect(result.bid_amount).toBe(1000);
    expect(result.daily_budget).toBe(5000);
  });

  it('OUTCOME_SALES + SEM pixel + custo mais baixo → LINK_CLICKS, sem bid_strategy, sem promoted_object', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetType: 'CBO',
      budgetValue: 5000,
    });
    expect(result.optimization_goal).toBe('LINK_CLICKS');
    expect(result.promoted_object).toBeUndefined();
    expect(result.bid_strategy).toBeUndefined();
    expect(result.daily_budget).toBeUndefined(); // CBO → no daily_budget no adset
  });

  it('OUTCOME_SALES + COM pixel + custo mais baixo (ABO) → LINK_CLICKS, sem bid_strategy, sem promoted_object', () => {
    // Este é o caso que gerava erro 2490487 — pixel presente mas sem bid constraints
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_SALES',
      pixelId: 'px_real',
      conversionEvent: 'PURCHASE',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      budgetType: 'ABO',
      budgetValue: 5000,
    });
    expect(result.optimization_goal).toBe('LINK_CLICKS');
    expect(result.promoted_object).toBeUndefined();
    expect(result.bid_strategy).toBeUndefined();
    expect(result.daily_budget).toBe(5000); // ABO → daily_budget no adset
  });

  it('OUTCOME_TRAFFIC + sem pixel + COST_CAP com valor → LINK_CLICKS + bid params', () => {
    const result = buildAdsetPayloadExtras({
      objective: 'OUTCOME_TRAFFIC',
      bidStrategy: 'COST_CAP',
      bidCapValue: 750,
    });
    expect(result.optimization_goal).toBe('LINK_CLICKS');
    expect(result.bid_strategy).toBe('COST_CAP');
    expect(result.bid_amount).toBe(750);
  });
});
