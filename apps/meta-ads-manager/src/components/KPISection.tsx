'use client';

import React, { useState } from 'react';

export interface KPIData {
  roas: number;
  activeCampaigns: number;
  dailySpend: number;
  monthlySpend: number;
  conversions: number;
}

interface KPISectionProps {
  data: KPIData;
}

export function KPISection({ data }: KPISectionProps) {
  const [selectedMetrics] = useState<string[]>(['roas', 'activeCampaigns', 'spend', 'conversions']);

  const metrics = [
    {
      id: 'roas',
      label: 'ROAS',
      value: data.roas.toFixed(2),
      unit: 'x',
      icon: '📈',
      description: 'Return on Ad Spend',
      color: 'from-growth-500 to-growth-600',
      accentColor: 'text-growth-400',
    },
    {
      id: 'activeCampaigns',
      label: 'Campanhas Ativas',
      value: data.activeCampaigns.toString(),
      unit: '',
      icon: '🎯',
      description: 'Campanhas em veiculação',
      color: 'from-energy-500 to-energy-600',
      accentColor: 'text-energy-400',
    },
    {
      id: 'spend',
      label: 'Gasto',
      value: `$${(data.monthlySpend / 1000).toFixed(1)}k`,
      unit: '/mês',
      icon: '💰',
      description: `Hoje: $${data.dailySpend.toFixed(2)}`,
      color: 'from-purple-500 to-pink-500',
      accentColor: 'text-purple-400',
    },
    {
      id: 'conversions',
      label: 'Conversões',
      value: data.conversions.toString(),
      unit: 'total',
      icon: '✨',
      description: 'Ações realizadas',
      color: 'from-cyan-500 to-blue-500',
      accentColor: 'text-cyan-400',
    },
  ];

  const visibleMetrics = metrics.filter(m => selectedMetrics.includes(m.id));

  return (
    <section className="px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-white">Key Performance</h2>
        <button className="text-sm text-energy-400 hover:text-energy-300 underline">
          ⚙️ Customizar
        </button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleMetrics.map((metric) => (
          <div
            key={metric.id}
            className={`group p-6 rounded-xl border border-gray-700/50 bg-gradient-to-br ${metric.color}/5 hover:border-gray-600/80 transition-all duration-300 cursor-pointer overflow-hidden relative`}
          >
            {/* Background glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">{metric.label}</p>
                  <p className="text-gray-500 text-xs">{metric.description}</p>
                </div>
                <span className="text-3xl">{metric.icon}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-display font-bold ${metric.accentColor}`}>
                  {metric.value}
                </span>
                {metric.unit && <span className="text-sm text-gray-500">{metric.unit}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
