'use client';

import React from 'react';
import { TrendingUp, BarChart3, DollarSign, CheckCircle, Settings } from 'lucide-react';

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
  const metrics = [
    {
      id:          'roas',
      label:       'ROAS',
      value:       data.roas.toFixed(2),
      unit:        'x',
      icon:        TrendingUp,
      description: 'Retorno sobre investimento',
    },
    {
      id:          'activeCampaigns',
      label:       'Campanhas Ativas',
      value:       data.activeCampaigns.toString(),
      unit:        '',
      icon:        BarChart3,
      description: 'Em veiculação agora',
    },
    {
      id:          'spend',
      label:       'Gasto',
      value:       `R$${(data.monthlySpend / 1000).toFixed(1)}k`,
      unit:        '/mês',
      icon:        DollarSign,
      description: `Hoje: R$${data.dailySpend.toFixed(2)}`,
    },
    {
      id:          'conversions',
      label:       'Conversões',
      value:       data.conversions.toString(),
      unit:        'total',
      icon:        CheckCircle,
      description: 'Ações realizadas',
    },
  ];

  return (
    <section className="px-6 py-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', margin: 0 }}
          >
            Performance
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Métricas em tempo real
          </p>
        </div>
        <button
          className="btn-ghost"
          style={{ fontSize: '12px', padding: '5px 10px', color: 'var(--color-text-tertiary)' }}
          aria-label="Customizar métricas"
        >
          <Settings size={13} strokeWidth={1.5} aria-hidden="true" />
          Customizar
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              className="p-4 transition-all"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-accent)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
            >
              {/* Header row: label + icon */}
              <div className="flex items-center justify-between mb-3">
                <p className="col-header">{metric.label}</p>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-bg-input)',
                    color: 'var(--color-text-tertiary)',
                  }}
                  role="img"
                  aria-label={metric.label}
                >
                  <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                </div>
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-1.5">
                <span
                  className="value-mono"
                  style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-text-primary)' }}
                >
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {metric.unit}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
