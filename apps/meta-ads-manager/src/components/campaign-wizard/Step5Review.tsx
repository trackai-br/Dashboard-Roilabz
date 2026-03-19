import React from 'react';

interface WizardFormData {
  accountId: string;
  accountName: string;
  campaignName?: string;
  campaignObjective?: string;
  budgetType?: 'daily' | 'lifetime';
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;
  adSetName?: string;
  adSetBillingEvent?: string;
  adSetBidStrategy?: string;
  adSetBidAmount?: number;
  adName?: string;
  creativeHeadline?: string;
  creativeBody?: string;
  creativeUrl?: string;
  pageId?: string;
  pixelId?: string;
}

interface Step5Props {
  formData: WizardFormData;
}

export default function Step5Review({ formData }: Step5Props) {
  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Resumo da Campanha</h2>
      <p className="text-gray-600 mb-8">Revise todas as configurações antes de publicar.</p>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-4">🎯 Conta</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase">Conta</p>
              <p className="text-lg font-medium">{formData.accountName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">ID</p>
              <p className="text-sm font-mono">{formData.accountId}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-4">📊 Campanha</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase">Nome</p>
              <p className="text-lg font-medium">{formData.campaignName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Objetivo</p>
              <p className="text-lg font-medium">{formData.campaignObjective}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Orçamento</p>
              <p className="text-lg font-medium">{formatCurrency(formData.budgetType === 'daily' ? formData.campaignDailyBudget : formData.campaignLifetimeBudget)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-4">🎪 Ad Set</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase">Nome</p>
              <p className="text-lg font-medium">{formData.adSetName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Faturamento</p>
              <p className="text-lg font-medium">{formData.adSetBillingEvent}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Estratégia</p>
              <p className="text-lg font-medium">{formData.adSetBidStrategy}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-4">📢 Anúncio</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase">Nome</p>
              <p className="text-lg font-medium">{formData.adName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Título</p>
              <p className="text-base">{formData.creativeHeadline}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Descrição</p>
              <p className="text-base">{formData.creativeBody}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">URL</p>
              <p className="text-sm font-mono text-blue-600">{formData.creativeUrl}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          ✓ <strong>Pronto para publicar!</strong> Clique em &quot;Publicar Campanha&quot; para continuar.
        </p>
      </div>
    </div>
  );
}
