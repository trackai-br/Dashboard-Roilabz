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
    <section className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold" style={{ color: 'var(--color-primary)' }}>
            Key Performance
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-secondary)' }}>
            Métricas de desempenho em tempo real
          </p>
        </div>
        <button
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
          style={{
            color: 'var(--color-brand)',
            backgroundColor: 'rgba(231, 111, 81, 0.06)',
            border: '1px solid rgba(231, 111, 81, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(231, 111, 81, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(231, 111, 81, 0.06)';
          }}
        >
          ⚙️ Customizar
        </button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleMetrics.map((metric) => (
          <div
            key={metric.id}
            className="group p-6 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden relative"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: 'var(--border-light)',
              boxShadow: 'var(--shadow-card)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <p
                    className="text-xs font-bold mb-2 tracking-wide"
                    style={{
                      color: 'var(--color-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}
                  >
                    {metric.label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-tertiary)' }}>
                    {metric.description}
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-3"
                  style={{
                    backgroundColor: `${metric.accentColor}14`,
                    color: metric.accentColor,
                  }}
                >
                  {metric.icon}
                </div>
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-2 pt-4" style={{ borderTop: 'var(--border-light)' }}>
                <span
                  className="text-4xl font-mono font-bold"
                  style={{ color: metric.accentColor }}
                >
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                    {metric.unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
