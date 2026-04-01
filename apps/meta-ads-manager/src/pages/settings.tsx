import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import MetaConnectionCard from '@/components/MetaConnectionCard';

export default function SettingsPage() {
  const sectionCard = {
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-tertiary)',
    marginBottom: '10px',
  };

  return (
    <DashboardLayout title="Configurações">
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: '20px',
            letterSpacing: '-0.03em',
            color: 'var(--color-text-primary)',
            margin: '0 0 6px',
          }}>
            Configurações
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
            Gerencie suas conexões e preferências
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Integrações */}
          <section>
            <p style={sectionLabel}>Integrações</p>
            <MetaConnectionCard />
          </section>

          {/* Conta & Segurança */}
          <section>
            <p style={sectionLabel}>Conta & Segurança</p>
            <div style={sectionCard}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                Em breve: autenticação dois fatores, alteração de senha.
              </p>
            </div>
          </section>

          {/* Notificações */}
          <section>
            <p style={sectionLabel}>Notificações</p>
            <div style={sectionCard}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
                Em breve: configurações de alertas e notificações.
              </p>
            </div>
          </section>

          {/* Sobre */}
          <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
            <p style={sectionLabel}>Sobre</p>
            <div style={sectionCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Aplicação', value: 'ROILabz Dashboard' },
                  { label: 'Versão', value: '1.0.0' },
                  { label: 'Stack', value: 'Next.js · Supabase · React Query' },
                ].map(({ label, value }) => (
                  <p key={label} style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}:</span>{' '}
                    {value}
                  </p>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}
