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
            <div className="w-full max-w-2xl bg-dark-900 border border-dark-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-dark-950 via-dark-900 to-dark-950 border-b border-dark-700/50 px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-growth-400 to-energy-400 bg-clip-text text-transparent">
                    {step === 'campaign' && 'Criar Nova Campanha'}
                    {step === 'budget' && 'Configurar Orçamento'}
                    {step === 'confirmation' && 'Confirmar Criação'}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-dark-400 hover:text-white transition-colors"
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
                              ? 'rgb(16, 185, 129)'
                              : 'rgb(55, 65, 81)',
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
                                ? 'rgb(16, 185, 129)'
                                : 'rgb(55, 65, 81)',
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome da Campanha
                      </label>
                      <input
                        type="text"
                        value={formData.campaignName}
                        onChange={(e) =>
                          setFormData({ ...formData, campaignName: e.target.value })
                        }
                        placeholder="ex: Promoção de Primavera"
                        className="w-full bg-dark-800 border border-dark-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-growth-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Objetivo da Campanha
                      </label>
                      <select
                        value={formData.objective}
                        onChange={(e) =>
                          setFormData({ ...formData, objective: e.target.value })
                        }
                        className="w-full bg-dark-800 border border-dark-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-growth-500/50"
                      >
                        <option value="OUTCOME_SALES">Compras</option>
                        <option value="OUTCOME_LEADS">Leads</option>
                        <option value="LINK_CLICKS">Cliques no Link</option>
                        <option value="IMPRESSIONS">Impressões</option>
                      </select>
                    </div>

                    <div className="border-t border-dark-700/30 pt-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isBulk}
                          onChange={(e) =>
                            setFormData({ ...formData, isBulk: e.target.checked })
                          }
                          className="w-4 h-4 rounded bg-dark-800 border border-dark-600 cursor-pointer accent-growth-500"
                        />
                        <span className="text-sm font-medium text-gray-300">
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Orçamento Diário (USD)
                      </label>
                      <input
                        type="number"
                        value={formData.dailyBudget}
                        onChange={(e) =>
                          setFormData({ ...formData, dailyBudget: e.target.value })
                        }
                        placeholder="ex: 50.00"
                        className="w-full bg-dark-800 border border-dark-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-growth-500/50"
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        Orçamento mínimo recomendado: USD 5.00
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Data de Início
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                          }
                          className="w-full bg-dark-800 border border-dark-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-growth-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Data de Fim (Opcional)
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({ ...formData, endDate: e.target.value })
                          }
                          className="w-full bg-dark-800 border border-dark-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-growth-500/50"
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
                    <div className="bg-growth-500/10 border border-growth-500/30 rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">Nome da Campanha:</span>
                        <span className="font-medium text-white">
                          {formData.campaignName || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">Objetivo:</span>
                        <span className="font-medium text-white">
                          {formData.objective}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">Orçamento Diário:</span>
                        <span className="font-medium text-white">
                          ${formData.dailyBudget || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-400">Modo:</span>
                        <span className="font-medium text-white">
                          {formData.isBulk ? 'Múltiplas Contas' : 'Conta Única'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-energy-500/10 border border-energy-500/30 rounded-lg p-4">
                      <p className="text-sm text-gray-300">
                        ℹ️ A campanha será criada e aparecerá no seu Meta Ads Manager em breve.
                        Você poderá editar criativos na próxima etapa.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-dark-950 border-t border-dark-700/50 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={step === 'campaign' ? onClose : handlePrev}
                  className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
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
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-energy-500 to-energy-600 text-white font-medium hover:shadow-lg hover:shadow-energy-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  )}

                  {step === 'confirmation' && (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-growth-500 to-growth-600 text-white font-medium hover:shadow-lg hover:shadow-growth-500/30 transition-all shadow-lg shadow-growth-500/20"
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
