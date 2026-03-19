import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import MetaConnectionCard from '@/components/MetaConnectionCard';

/**
 * Página de Settings/Configurações
 * Local central para gerenciar conexões e configurações
 */
export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold text-primary">Configurações</h1>
          <p className="text-secondary">Gerencie suas conexões com plataformas de publicidade</p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Meta/Facebook Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-primary">Integrações de Publicidade</h2>
            <MetaConnectionCard />
          </section>

          {/* Account Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-primary">Conta & Segurança</h2>
            <div className="rounded-[12px] border border-neon-green/20 bg-card p-6 shadow-card">
              <p className="text-secondary">Em breve: Autenticação dois fatores, alteração de senha, etc.</p>
            </div>
          </section>

          {/* Notifications Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-primary">Notificações</h2>
            <div className="rounded-[12px] border border-neon-green/20 bg-card p-6 shadow-card">
              <p className="text-secondary">Em breve: Configurações de alertas e notificações</p>
            </div>
          </section>

          {/* About Section */}
          <section className="border-t border-neon-green/10 pt-8">
            <h2 className="mb-4 text-lg font-semibold text-primary">Sobre</h2>
            <div className="rounded-[12px] border border-neon-green/20 bg-card p-6 shadow-card">
              <div className="space-y-2 text-sm text-secondary">
                <p>
                  <span className="font-semibold text-primary">Aplicação:</span> Meta Ads Manager Dashboard
                </p>
                <p>
                  <span className="font-semibold text-primary">Versão:</span> 1.0.0
                </p>
                <p>
                  <span className="font-semibold text-primary">Stack:</span> Next.js, Supabase, React Query
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
