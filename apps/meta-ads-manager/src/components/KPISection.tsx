'use client';

import React from 'react';
import { TrendingUp, ShoppingCart, Zap, Target, Globe } from 'lucide-react';

export interface KPIData {
  roas: number;
  activeCampaigns: number;
  dailySpend: number;
  monthlySpend: number;
  conversions: number;
  activePages?: number;
}

interface KPISectionProps {
  data: KPIData;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$${(value / 1000).toFixed(1)}k`;
  return `R$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString('pt-BR');
}

interface BigCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
  accent?: boolean;
}

function BigCard({ label, value, sub, icon: Icon, loading, accent }: BigCardProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: '20px 24px',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        minWidth: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-accent)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Top row: label + icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
        }}>
          {label}
        </span>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: accent ? 'rgba(22,163,74,0.1)' : 'var(--color-bg-input)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent ? 'var(--color-accent-bright)' : 'var(--color-text-tertiary)',
          flexShrink: 0,
        }}>
          <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <div className="animate-pulse" style={{ height: '36px', width: '120px', borderRadius: '6px', backgroundColor: 'var(--color-bg-input)' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '32px',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: 'var(--color-text-primary)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}>
            {value}
          </span>
        </div>
      )}

      {/* Sub */}
      {sub && !loading && (
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          color: 'var(--color-text-tertiary)',
          marginTop: '8px',
          letterSpacing: '-0.01em',
        }}>
          {sub}
        </p>
      )}
    </div>
  );
}

interface SmallCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
}

function SmallCard({ label, value, sub, icon: Icon, loading }: SmallCardProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: '16px 20px',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minWidth: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-accent)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-bg-input)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-tertiary)',
        flexShrink: 0,
      }}>
        <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
      </div>

      {/* Text */}
      <div style={{ minWidth: 0 }}>
        <span style={{
          display: 'block',
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginBottom: '4px',
        }}>
          {label}
        </span>
        {loading ? (
          <div className="animate-pulse" style={{ height: '24px', width: '60px', borderRadius: '4px', backgroundColor: 'var(--color-bg-input)' }} />
        ) : (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}>
            {value}
          </span>
        )}
        {sub && !loading && (
          <span style={{
            display: 'block',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
            marginTop: '3px',
          }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

export function KPISection({ data, loading }: KPISectionProps) {
  return (
    <section style={{ padding: '20px 24px' }}>

      {/* Linha 1 — 3 cards grandes em destaque */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <BigCard
          label="Valor Usado"
          value={formatCurrency(data.monthlySpend)}
          sub={`Hoje: ${formatCurrency(data.dailySpend)}`}
          icon={Zap}
          loading={loading}
          accent
        />
        <BigCard
          label="Número de Vendas"
          value={formatNumber(data.conversions)}
          sub="Conversões totais"
          icon={ShoppingCart}
          loading={loading}
        />
        <BigCard
          label="ROAS"
          value={`${data.roas.toFixed(2)}x`}
          sub="Retorno sobre investimento"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Linha 2 — 2 cards menores */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <SmallCard
          label="Campanhas Ativas"
          value={formatNumber(data.activeCampaigns)}
          sub="Em veiculação agora"
          icon={Target}
          loading={loading}
        />
        <SmallCard
          label="Páginas Ativas"
          value={formatNumber(data.activePages ?? 0)}
          sub="Páginas conectadas"
          icon={Globe}
          loading={loading}
        />
      </div>

    </section>
  );
}
