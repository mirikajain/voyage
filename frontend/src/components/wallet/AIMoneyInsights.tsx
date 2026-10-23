import React from 'react';
import { Sparkles, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AIMoneyInsights: React.FC = () => {
  const { setIsOptimizeModalOpen } = useApp();

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 rounded-3xl p-6 sm:p-8 border border-voyage-gold/40 shadow-soft-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-voyage-dark text-voyage-gold shadow-soft-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark">
              AI Money Insights
            </h3>
            <p className="text-xs text-voyage-muted">Autonomous budget anomaly detection & reallocation</p>
          </div>
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/20">
          Action Advised
        </span>
      </div>

      {/* Anomaly Highlight */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-voyage-gold/30 shadow-soft-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-amber-100/80 text-amber-800 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-voyage-dark">
              "You are spending 14% more on dining than planned."
            </h4>
            <p className="text-xs text-voyage-muted leading-relaxed max-w-xl">
              Paris fine dining reservations currently stand at ₹18,200 vs ₹16,000 target. Voyage has identified ₹4,200 surplus in your Transport envelope that can be safely reallocated without affecting comfort.
            </p>
          </div>
        </div>

        {/* Optimize Button */}
        <button
          onClick={() => setIsOptimizeModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-voyage-dark hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-soft-sm hover:shadow-gold-glow transition-all flex-shrink-0"
        >
          <Sparkles className="w-4 h-4 text-voyage-gold" />
          <span>Optimize my remaining trip</span>
          <ArrowRight className="w-3.5 h-3.5 text-voyage-gold" />
        </button>
      </div>

      {/* Quick bullet points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-voyage-slate">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>No flight or hotel reservations affected</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Preserves ₹17,600 emergency contingency intact</span>
        </div>
      </div>
    </div>
  );
};
