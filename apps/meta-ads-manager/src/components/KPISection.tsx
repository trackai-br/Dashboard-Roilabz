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
      color: 'from-brand to-coral',
      accentColor: 'var(--color-brand)',
    },
    {
      id: 'activeCampaigns',
      label: 'Campanhas Ativas',
      value: data.activeCampaigns.toString(),
      unit: '',
      icon: '🎯',
      description: 'Campanhas em veiculação',
      color: 'from-teal to-teal-light',
      accentColor: 'var(--color-teal)',
    },
    {
      id: 'spend',
      label: 'Gasto',
      value: `$${(data.monthlySpend / 1000).toFixed(1)}k`,
      unit: '/mês',
      icon: '💰',
      description: `Hoje: $${data.dailySpend.toFixed(2)}`,
      color: 'from-sand to-coral',
      accentColor: 'var(--color-sand)',
    },
    {
      id: 'conversions',
      label: 'Conversões',
      value: data.conversions.toString(),
      unit: 'total',
      icon: '✨',
      description: 'Ações realizadas',
      color: 'from-success to-success',
      accentColor: 'var(--color-success)',
    },
  ];

  const visibleMetrics = metrics.filter(m => selectedMetrics.includes(m.id));

  return (
    <section className="px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--color-primary)' }}>
          Key Performance
        </h2>
        <button className="text-sm underline" style={{ color: 'var(--color-brand)' }}>
          ⚙️ Customizar
        </button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleMetrics.map((metric) => (
          <div
            key={metric.id}
            className="group p-6 rounded-card border transition-all duration-300 cursor-pointer overflow-hidden relative"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--color-tertiary)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium mb-1 uppercase text-xs" style={{ color: 'var(--color-secondary)' }}>
                    {metric.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-tertiary)' }}>
                    {metric.description}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)', color: metric.accentColor }}
                >
                  {metric.icon}
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold" style={{ color: metric.accentColor }}>
                  {metric.value}
                </span>
                {metric.unit && <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>{metric.unit}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
