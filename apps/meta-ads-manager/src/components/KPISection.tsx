'use client';

import React, { useState } from 'react';
import { TrendingUp, BarChart3, DollarSign, CheckCircle } from 'lucide-react';

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
      icon: TrendingUp,
      description: 'Return on Ad Spend',
      color: 'from-brand to-coral',
      accentColor: 'var(--color-brand)',
    },
    {
      id: 'activeCampaigns',
      label: 'Campanhas Ativas',
      value: data.activeCampaigns.toString(),
      unit: '',
      icon: BarChart3,
      description: 'Campanhas em veiculação',
      color: 'from-teal to-teal-light',
      accentColor: 'var(--color-teal)',
    },
    {
      id: 'spend',
      label: 'Gasto',
      value: `$${(data.monthlySpend / 1000).toFixed(1)}k`,
      unit: '/mês',
      icon: DollarSign,
      description: `Hoje: $${data.dailySpend.toFixed(2)}`,
      color: 'from-sand to-coral',
      accentColor: 'var(--color-sand)',
    },
    {
      id: 'conversions',
      label: 'Conversões',
      value: data.conversions.toString(),
      unit: 'total',
      icon: CheckCircle,
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
          <h2
            className="text-3xl font-display font-bold"
            style={{
              color: 'var(--neon-green)',
              textShadow: '0 0 12px rgba(57, 255, 20, 0.3)',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              letterSpacing: '0.05em',
            }}
          >
            KEY PERFORMANCE
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--color-secondary)' }}>
            Métricas de desempenho em tempo real
          </p>
        </div>
        <button
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
          style={{
            color: 'var(--neon-green)',
            backgroundColor: 'rgba(57, 255, 20, 0.08)',
            border: '1px solid rgba(57, 255, 20, 0.2)',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: '0.03em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(57, 255, 20, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.08)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ⚙️ CUSTOMIZAR
        </button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleMetrics.map((metric) => (
          <div
            key={metric.id}
            className="group p-6 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden relative backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.7)',
              border: 'var(--border-light)',
              boxShadow: 'var(--shadow-card)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.4)';
              e.currentTarget.style.backgroundColor = 'rgba(26, 26, 46, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.1)';
              e.currentTarget.style.backgroundColor = 'rgba(26, 26, 46, 0.7)';
            }}
          >
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <p
                    className="text-xs font-bold mb-2 tracking-wide"
                    style={{
                      color: 'var(--neon-green)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontFamily: "'Space Grotesk', system-ui, sans-serif",
                      textShadow: '0 0 6px rgba(57, 255, 20, 0.25)',
                    }}
                  >
                    {metric.label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-tertiary)' }}>
                    {metric.description}
                  </p>
                </div>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
                  style={{
                    backgroundColor: 'rgba(57, 255, 20, 0.1)',
                    color: 'var(--neon-green)',
                    boxShadow: '0 0 12px rgba(57, 255, 20, 0.3)',
                  }}
                  role="img"
                  aria-label={metric.label}
                >
                  <metric.icon size={24} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-2 pt-4" style={{ borderTop: 'var(--border-light)' }}>
                <span
                  className="text-4xl font-mono font-bold"
                  style={{
                    color: 'var(--neon-green)',
                    textShadow: '0 0 12px rgba(57, 255, 20, 0.4)',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)', fontSize: '0.85rem' }}>
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
