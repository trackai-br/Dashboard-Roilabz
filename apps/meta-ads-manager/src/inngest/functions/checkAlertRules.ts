import { inngest } from '../client';
import { createClient } from '@supabase/supabase-js';
import { metaAPI } from '@/lib/meta-api';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return supabase;
}

interface AlertRule {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  condition_type: string;
  condition_value: Record<string, any>;
  enabled: boolean;
  telegram_enabled: boolean;
  telegram_chat_id?: string;
}

interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  actions?: Array<{ action_type: string; value: string }>;
  cpc?: string;
  cpm?: string;
  ctr?: string;
}

export const checkAlertRules = inngest.createFunction(
  { id: 'check-alert-rules', retries: 2 },
  { cron: '*/15 * * * *' },
  async ({ event, step }) => {
    try {
      const supabaseClient = getSupabase();

      // Buscar todas as regras habilitadas
      const { data: rules, error: rulesError } = await supabaseClient
        .from('meta_alert_rules')
        .select('*')
        .eq('enabled', true);

      if (rulesError) {
        throw new Error(`Erro ao buscar regras: ${rulesError.message}`);
      }

      let triggeredCount = 0;

      // Processar cada regra
      for (const rule of (rules || []) as AlertRule[]) {
        await step.run(`check-rule-${rule.id}`, async () => {
          try {
            const triggered = await evaluateRule(rule);

            if (triggered) {
              triggeredCount++;

              // Criar notificação no dashboard
              const message = generateAlertMessage(rule, triggered);

              const { error: notifError } = await supabaseClient
                .from('meta_notifications')
                .insert({
                  user_id: rule.user_id,
                  alert_rule_id: rule.id,
                  campaign_id: triggered.campaignId,
                  message,
                  metric_name: rule.condition_type,
                  metric_value: triggered.metricValue,
                  threshold_value: rule.condition_value.threshold,
                  read: false,
                } as any);

              if (notifError) {
                console.error('Erro ao criar notificação:', notifError);
              }

              // Enviar para Telegram se habilitado
              if (rule.telegram_enabled && rule.telegram_chat_id) {
                await sendTelegramMessage(
                  rule.telegram_chat_id,
                  message,
                  triggered
                ).catch((err) => {
                  console.error('Erro ao enviar para Telegram:', err);
                });
              }
            }
          } catch (ruleError) {
            console.error(`Erro ao processar regra ${rule.id}:`, ruleError);
          }
        });
      }

      return {
        success: true,
        rulesChecked: rules?.length || 0,
        triggeredCount,
      };
    } catch (error) {
      console.error('Erro ao verificar regras de alerta:', error);
      throw error;
    }
  }
);

async function evaluateRule(
  rule: AlertRule
): Promise<{ campaignId: string; metricValue: number } | null> {
  try {
    const supabaseClient = getSupabase();

    // Buscar campanhas da conta
    const { data: account } = await supabaseClient
      .from('meta_accounts')
      .select('meta_account_id')
      .eq('id', rule.account_id)
      .single();

    if (!account) return null;

    // Buscar campanhas das últimas 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const { data: campaigns } = (await supabaseClient
      .from('meta_ads_campaigns')
      .select('campaign_id, campaign_name')
      .eq('meta_account_id', rule.account_id)
      .limit(10)) as any;

    if (!campaigns || campaigns.length === 0) return null;

    // Avaliar cada campanha contra a regra
    for (const campaign of campaigns as any[]) {
      try {
        const insights = await metaAPI.getInsights(
          campaign.campaign_id,
          sevenDaysAgo,
          today,
          'campaign'
        );

        if (insights.length === 0) continue;

        // Agregar métricas
        const aggregated = insights.reduce(
          (acc, insight) => ({
            spend: BigInt(acc.spend || 0) + BigInt(insight.spend || 0),
            impressions: BigInt(acc.impressions || 0) + BigInt(insight.impressions || 0),
            clicks: BigInt(acc.clicks || 0) + BigInt(insight.clicks || 0),
            actions: [...(acc.actions || []), ...(insight.actions || [])],
            cpc: insight.cpc,
            ctr: insight.ctr,
          }),
          {} as any
        );

        // Verificar condição
        const result = checkCondition(rule.condition_type, aggregated, rule.condition_value);

        if (result.triggered) {
          return {
            campaignId: campaign.campaign_id,
            metricValue: result.value,
          };
        }
      } catch (err) {
        console.error(
          `Erro ao buscar insights para campanha ${campaign.campaign_id}:`,
          err
        );
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao avaliar regra:', error);
    return null;
  }
}

function checkCondition(
  conditionType: string,
  metrics: Record<string, any>,
  conditionValue: Record<string, any>
): { triggered: boolean; value: number } {
  const threshold = conditionValue.threshold || 0;

  switch (conditionType) {
    case 'roas_below': {
      // ROAS = revenue / spend
      const spend = Number(metrics.spend || 0) / 100;
      const revenue = Number(metrics.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0);
      const roas = spend > 0 ? revenue / spend : 0;
      return { triggered: roas > 0 && roas < threshold, value: roas };
    }

    case 'daily_spend_above': {
      const spend = Number(metrics.spend || 0) / 100;
      const dailySpend = spend / 7; // aproximado para 7 dias
      return { triggered: dailySpend > threshold, value: dailySpend };
    }

    case 'cpc_above': {
      const cpc = Number(metrics.cpc || 0) / 100;
      return { triggered: cpc > threshold, value: cpc };
    }

    case 'ctr_below': {
      const ctr = Number(metrics.ctr || 0);
      return { triggered: ctr > 0 && ctr < threshold, value: ctr };
    }

    case 'conversion_rate_below': {
      const conversions = metrics.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0;
      const clicks = Number(metrics.clicks || 0);
      const rate = clicks > 0 ? (Number(conversions) / clicks) * 100 : 0;
      return { triggered: rate > 0 && rate < threshold, value: rate };
    }

    default:
      return { triggered: false, value: 0 };
  }
}

function generateAlertMessage(
  rule: AlertRule,
  triggered: { campaignId: string; metricValue: number }
): string {
  const conditionLabels: Record<string, string> = {
    roas_below: 'ROAS',
    daily_spend_above: 'Gasto Diário',
    cpc_above: 'CPC',
    ctr_below: 'CTR',
    conversion_rate_below: 'Taxa de Conversão',
  };

  const label = conditionLabels[rule.condition_type] || rule.condition_type;
  const threshold = rule.condition_value.threshold;

  let message = `⚠️ Alerta: ${rule.name}\n\n`;
  message += `Campanha: ${triggered.campaignId.slice(0, 8)}...\n`;
  message += `${label}: ${triggered.metricValue.toFixed(2)}\n`;
  message += `Threshold: ${threshold}`;

  return message;
}

async function sendTelegramMessage(
  chatId: string,
  message: string,
  triggered: { campaignId: string; metricValue: number }
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN não configurado');
    return;
  }

  const text = `${message}\n\n🔗 Ver detalhes: ${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${triggered.campaignId}`;

  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.statusText}`);
  }
}
