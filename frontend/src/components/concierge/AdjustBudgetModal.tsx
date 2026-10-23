import React, { useState } from 'react';
import { X, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdjustBudgetModal: React.FC = () => {
  const { isAdjustBudgetModalOpen, setIsAdjustBudgetModalOpen, handleAdjustBudgetSubmit, activeRecommendationResult } = useApp();
  const currentBudget = activeRecommendationResult?.breakdown.requestedBudget || 40000;
  const [budgetVal, setBudgetVal] = useState<number>(currentBudget);

  if (!isAdjustBudgetModalOpen) return null;

  const quickPresets = [30000, 40000, 50000, 65000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdjustBudgetSubmit(budgetVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-voyage-dark/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-luxury border border-voyage-border overflow-hidden p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-voyage-dark text-voyage-gold">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-xl font-bold text-voyage-dark">
                Adjust Trip Budget
              </h3>
              <p className="text-xs text-voyage-muted">Re-run agent optimization with new ceiling</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdjustBudgetModalOpen(false)}
            className="p-2 rounded-full hover:bg-voyage-bg text-voyage-muted hover:text-voyage-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">
              Target Budget Ceiling
            </label>
            <div className="relative flex items-center rounded-2xl border-2 border-voyage-border focus-within:border-voyage-dark bg-voyage-bg/70 p-3 pl-4">
              <span className="text-voyage-muted font-serif-luxury text-xl font-bold mr-2">₹</span>
              <input
                type="number"
                value={budgetVal}
                onChange={(e) => setBudgetVal(Number(e.target.value))}
                min={5000}
                max={500000}
                step={1000}
                className="w-full bg-transparent text-voyage-dark font-serif-luxury text-2xl font-bold outline-none"
              />
            </div>
          </div>

          {/* Quick Preset Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-voyage-muted uppercase tracking-wider">Quick Presets</span>
            <div className="grid grid-cols-4 gap-2">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudgetVal(preset)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    budgetVal === preset
                      ? 'bg-voyage-dark text-white border-voyage-dark shadow-soft-xs'
                      : 'bg-voyage-bg border-voyage-border text-voyage-slate hover:border-voyage-gold/50'
                  }`}
                >
                  ₹{(preset / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdjustBudgetModalOpen(false)}
              className="w-1/2 py-3 rounded-xl border border-voyage-border text-xs font-semibold text-voyage-slate hover:bg-voyage-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-soft-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-voyage-gold" />
              <span>Optimize Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
