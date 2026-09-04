import React from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FinancialSnapshotCard: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="bg-[#FFFEFC] rounded-3xl border border-voyage-border/80 p-5 sm:p-6 shadow-soft-xs hover:shadow-soft-md transition-all duration-300 flex flex-col justify-between h-full group">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-voyage-gold/15 text-voyage-gold-dark">
              Financial Instrument
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>

          <button
            onClick={() => setCurrentPage('wallet')}
            className="p-1.5 rounded-xl hover:bg-voyage-bg text-voyage-muted hover:text-voyage-dark transition-colors"
            title="Open Wallet"
          >
            <ArrowUpRight className="w-4 h-4 text-voyage-gold" />
          </button>
        </div>

        <h3 className="font-serif-luxury text-lg font-bold text-voyage-dark">
          Trip financial snapshot
        </h3>
        <p className="text-xs text-voyage-muted mb-4">
          Real-time expenditure & buffer analysis
        </p>

        {/* Primary Emphasized Allocation Metric */}
        <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-voyage-border/70 mb-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-voyage-muted">
              Trip Allocation
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              100% Cap Active
            </span>
          </div>
          <div className="text-3xl font-serif-luxury font-bold text-voyage-dark mt-0.5">
            ₹40,000
          </div>
          
          {/* Visual Ratio Bar */}
          <div className="mt-2.5 space-y-1">
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-voyage-border/60">
              <div className="h-full bg-voyage-dark" style={{ width: '70%' }} title="Committed: 70%" />
              <div className="h-full bg-emerald-500" style={{ width: '30%' }} title="Remaining: 30%" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-voyage-muted">
              <span>70% Committed</span>
              <span className="text-emerald-700 font-medium">30% Buffer</span>
            </div>
          </div>
        </div>

        {/* Structured Tiered Breakdown */}
        <div className="space-y-2">
          {/* Committed */}
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-voyage-bg/70 transition-colors text-xs">
            <div>
              <div className="font-semibold text-voyage-dark">Committed</div>
              <div className="text-[10px] text-voyage-muted">Hotels & Transfers</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-voyage-dark">₹27,900</div>
              <span className="text-[9px] font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded">70% locked</span>
            </div>
          </div>

          {/* Remaining */}
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-voyage-bg/70 transition-colors text-xs">
            <div>
              <div className="font-semibold text-voyage-dark">Remaining</div>
              <div className="text-[10px] text-voyage-muted">Unallocated cushion</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-emerald-700">₹12,100</div>
              <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">+30% cushion</span>
            </div>
          </div>

          {/* Potential Savings */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 border border-voyage-gold/20 text-xs">
            <div>
              <div className="font-semibold text-voyage-gold-dark">Potential savings</div>
              <div className="text-[10px] text-voyage-muted">Identified by AI</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-voyage-gold-dark">₹2,400</div>
              <span className="text-[9px] font-semibold text-voyage-gold-dark bg-amber-100/70 px-1.5 py-0.2 rounded">+6% saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-voyage-border/60">
        <div className="flex items-center justify-between text-xs text-voyage-dark font-medium bg-emerald-50/60 border border-emerald-200/50 p-2.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span className="text-[11px] text-emerald-900 font-semibold">
              Zero unexpected surcharges detected
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700">Safe</span>
        </div>
      </div>
    </div>
  );
};
