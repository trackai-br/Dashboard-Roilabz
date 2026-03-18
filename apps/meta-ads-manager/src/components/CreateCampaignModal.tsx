'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'campaign' | 'budget' | 'confirmation';

export function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
  const [step, setStep] = useState<Step>('campaign');
  const [formData, setFormData] = useState({
    campaignName: '',
    objective: 'OUTCOME_SALES',
    dailyBudget: '',
    startDate: '',
    endDate: '',
    isBulk: false,
  });

  const handleNext = () => {
    if (step === 'campaign') setStep('budget');
    else if (step === 'budget') setStep('confirmation');
  };

  const handlePrev = () => {
    if (step === 'budget') setStep('campaign');
    else if (step === 'confirmation') setStep('budget');
  };

  const handleSubmit = () => {
    // Submit logic here
    console.log('Campaign data:', formData);
    onClose();
    setStep('campaign');
  };

  const stepNumber = step === 'campaign' ? 1 : step === 'budget' ? 2 : 3;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="card w-full max-w-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}>
              {/* Header */}
              <div className="px-6 py-6 border-b" style={{ backgroundColor: 'var(--bg-page)', borderBottomColor: 'var(--color-tertiary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--color-brand)' }}>
                    {step === 'campaign' && 'Criar Nova Campanha'}
                    {step === 'budget' && 'Configurar Orçamento'}
                    {step === 'confirmation' && 'Confirmar Criação'}
                  </h2>
                  <button
                    onClick={onClose}
                    style={{ color: 'var(--color-primary)' }}
                    className="transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-3">
                  {[1, 2, 3].map((num) => (
                    <React.Fragment key={num}>
                      <motion.div
                        animate={{
                          backgroundColor:
                            num <= stepNumber
                              ? 'var(--color-brand)'
                              : 'var(--color-tertiary)',
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      >
                        {num}
                      </motion.div>
                      {num < 3 && (
                        <motion.div
                          animate={{
                            backgroundColor:
                              num < stepNumber
                                ? 'var(--color-brand)'
                                : 'var(--color-tertiary)',
                          }}
                          className="flex-grow h-1 rounded-full"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-8 min-h-72">
                {step === 'campaign' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                        Nome da Campanha
                      </label>
                      <input
                        type="text"
                        value={formData.campaignName}
                        onChange={(e) =>
                          setFormData({ ...formData, campaignName: e.target.value })
                        }
                        placeholder="ex: Promoção de Primavera"
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                        Objetivo da Campanha
                      </label>
                      <select
                        value={formData.objective}
                        onChange={(e) =>
                          setFormData({ ...formData, objective: e.target.value })
                        }
                        className="input w-full"
                      >
                        <option value="OUTCOME_SALES">Compras</option>
                        <option value="OUTCOME_LEADS">Leads</option>
                        <option value="LINK_CLICKS">Cliques no Link</option>
                        <option value="IMPRESSIONS">Impressões</option>
                      </select>
                    </div>

                    <div className="border-t pt-6" style={{ borderTopColor: 'var(--color-tertiary)' }}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isBulk}
                          onChange={(e) =>
                            setFormData({ ...formData, isBulk: e.target.checked })
                          }
                          className="w-4 h-4 rounded cursor-pointer"
                          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--color-tertiary)', accentColor: 'var(--color-brand)' }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                          Criar em múltiplas contas (Bulk)
                        </span>
                      </label>
                    </div>
                  </motion.div>
                )}

                {step === 'budget' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                        Orçamento Diário (USD)
                      </label>
                      <input
                        type="number"
                        value={formData.dailyBudget}
                        onChange={(e) =>
                          setFormData({ ...formData, dailyBudget: e.target.value })
                        }
                        placeholder="ex: 50.00"
                        className="input w-full"
                      />
                      <p className="mt-2 text-xs" style={{ color: 'var(--color-tertiary)' }}>
                        Orçamento mínimo recomendado: USD 5.00
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                          Data de Início
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                          }
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                          Data de Fim (Opcional)
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({ ...formData, endDate: e.target.value })
                          }
                          className="input w-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'confirmation' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="rounded-lg p-6 space-y-4 border" style={{ backgroundColor: 'var(--color-brand-subtle)', borderColor: 'var(--color-brand)' }}>
                      <div className="flex justify-between items-start">
                        <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>Nome da Campanha:</span>
                        <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                          {formData.campaignName || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>Objetivo:</span>
                        <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                          {formData.objective}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>Orçamento Diário:</span>
                        <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                          ${formData.dailyBudget || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>Modo:</span>
                        <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                          {formData.isBulk ? 'Múltiplas Contas' : 'Conta Única'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--color-info-bg)', borderColor: 'var(--color-info)' }}>
                      <p className="text-sm" style={{ color: 'var(--color-info)' }}>
                        ℹ️ A campanha será criada e aparecerá no seu Meta Ads Manager em breve.
                        Você poderá editar criativos na próxima etapa.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex items-center justify-between border-t" style={{ backgroundColor: 'var(--bg-page)', borderTopColor: 'var(--color-tertiary)' }}>
                <button
                  onClick={step === 'campaign' ? onClose : handlePrev}
                  className="px-6 py-2 text-sm font-medium transition-colors"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {step === 'campaign' ? 'Cancelar' : 'Voltar'}
                </button>

                <div className="flex items-center gap-3">
                  {step !== 'confirmation' && (
                    <button
                      onClick={handleNext}
                      disabled={
                        (step === 'campaign' && !formData.campaignName) ||
                        (step === 'budget' && !formData.dailyBudget)
                      }
                      className="px-6 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'var(--color-coral)' }}
                    >
                      Próximo
                    </button>
                  )}

                  {step === 'confirmation' && (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 rounded-lg text-white font-medium transition-all shadow-lg"
                      style={{ backgroundColor: 'var(--color-brand)' }}
                    >
                      Criar Campanha
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
