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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl py-6 px-5">
        <div className="mb-6">
          <h1 className="mb-1 text-lg font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>Configurações</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>Gerencie suas conexões com plataformas de publicidade</p>
        </div>

        <div className="space-y-5">
          <section>
            <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Integrações</h2>
            <MetaConnectionCard />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conta & Segurança</h2>
            <div style={sectionCard}>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>Em breve: Autenticação dois fatores, alteração de senha, etc.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notificações</h2>
            <div style={sectionCard}>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>Em breve: Configurações de alertas e notificações</p>
            </div>
          </section>

          <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sobre</h2>
            <div style={sectionCard}>
              <div className="space-y-1.5 text-sm" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                <p><span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Aplicação:</span> ROILabz Dashboard</p>
                <p><span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Versão:</span> 1.0.0</p>
                <p><span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Stack:</span> Next.js, Supabase, React Query</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
