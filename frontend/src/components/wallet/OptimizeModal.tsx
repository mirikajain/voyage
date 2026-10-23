import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

export const OptimizeModal: React.FC = () => {
  const { isOptimizeModalOpen, setIsOptimizeModalOpen } = useApp();
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  if (!isOptimizeModalOpen) return null;

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsApplied(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C5A059', '#10B981', '#111827'],
      });
    }, 1200);
  };

  const handleClose = () => {
    setIsOptimizeModalOpen(false);
    setIsApplied(false);
    setIsApplying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-voyage-dark/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-luxury border border-voyage-border overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-voyage-dark text-voyage-gold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark">
                AI Budget Optimization
              </h3>
              <p className="text-xs text-voyage-muted">Autonomous capital reallocation for Paris Trip</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-voyage-bg text-voyage-muted hover:text-voyage-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isApplied ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/60">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="font-serif-luxury text-2xl font-bold text-voyage-dark">
                Envelopes Rebalanced Successfully
              </h4>
              <p className="text-xs text-voyage-muted max-w-sm mx-auto mt-1">
                Your Paris dining budget has been increased by ₹3,000 without exceeding your total ₹1,50,000 ceiling.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-voyage-bg text-xs space-y-2 border border-voyage-border text-left">
              <div className="flex justify-between">
                <span className="text-voyage-muted">New Dining Target:</span>
                <span className="font-bold text-voyage-dark">₹19,000 (within safe buffer)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-voyage-muted">Transport Surplus Reclaimed:</span>
                <span className="font-bold text-voyage-dark">₹4,200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-voyage-muted">Added to Emergency Cushion:</span>
                <span className="font-bold text-emerald-700">+₹1,200</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-voyage-dark text-white text-xs font-semibold shadow-soft-sm hover:bg-slate-900 transition-all"
            >
              Done & Return to Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-voyage-slate leading-relaxed">
              Voyage detected an anomaly in dining spend (+14%). To maintain your overall ₹1,50,000 hard ceiling, the AI proposes the following autonomous envelope rebalancing:
            </p>

            {/* Reallocation Plan */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-voyage-bg border border-voyage-border/80 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-voyage-dark">Transport Envelope</p>
                  <p className="text-[11px] text-voyage-muted">Shift under-utilized Paris Metro & transfer allocation</p>
                </div>
                <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  - ₹4,200
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-voyage-gold/30 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-voyage-dark">Dining & Gastronomy Envelope</p>
                  <p className="text-[11px] text-voyage-muted">Expands ceiling to accommodate Les Ombres rooftop dinner</p>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  + ₹3,000
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/30 border border-emerald-200/50 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-voyage-dark">Emergency Cushion</p>
                  <p className="text-[11px] text-voyage-muted">Surplus routed into untouchable reserve</p>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  + ₹1,200
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-voyage-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay Travel Vault: Zero fees, instant re-allocation</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="w-1/2 py-3 rounded-xl border border-voyage-border text-xs font-semibold text-voyage-slate hover:bg-voyage-bg transition-colors"
              >
                Keep Current
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="w-1/2 py-3 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-soft-sm transition-all"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-voyage-gold" />
                    <span>Rebalancing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-voyage-gold" />
                    <span>Apply Optimization</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
