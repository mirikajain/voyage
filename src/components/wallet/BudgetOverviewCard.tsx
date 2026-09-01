import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BudgetOverviewCard: React.FC = () => {
  const { userProfile } = useApp();
  const spent = userProfile.totalSpent || 132400;
  const total = userProfile.totalBudget || 200000;
  const remaining = Math.max(0, total - spent);
  const percentage = Math.min(100, Math.round((spent / total) * 100));

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-sm relative overflow-hidden space-y-6">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-100/30 via-slate-100/20 to-transparent rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-voyage-dark text-voyage-gold">
              Active Envelope
            </span>
            <span className="text-xs text-voyage-muted font-medium">Voyage Travel Ledger</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-tight text-voyage-dark">
            Portfolio Spend & Budget
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Razorpay Spend Guardrails Enforced</span>
        </div>
      </div>

      {/* Primary Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-voyage-bg border border-voyage-border/70">
        <div>
          <span className="text-xs font-medium text-voyage-muted uppercase tracking-wider block">
            Committed Spend
          </span>
          <p className="font-serif-luxury text-3xl font-bold text-voyage-dark mt-1">
            ₹{spent.toLocaleString()}
          </p>
          <span className="text-[11px] text-voyage-muted">{percentage}% of target envelope</span>
        </div>

        <div>
          <span className="text-xs font-medium text-voyage-muted uppercase tracking-wider block">
            Total Trip Budget
          </span>
          <p className="font-serif-luxury text-3xl font-bold text-slate-700 mt-1">
            ₹{total.toLocaleString()}
          </p>
          <span className="text-[11px] text-voyage-muted">Cap locked by user</span>
        </div>

        <div>
          <span className="text-xs font-medium text-voyage-muted uppercase tracking-wider block">
            Remaining Cushion
          </span>
          <p className="font-serif-luxury text-3xl font-bold text-emerald-700 mt-1">
            ₹{remaining.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Available for new trips</span>
        </div>
      </div>

      {/* Multi-tier Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-voyage-slate">Budget Consumption Status</span>
          <span className="font-semibold text-voyage-dark">{percentage}% Utilized</span>
        </div>

        <div className="w-full h-3 bg-voyage-bg rounded-full overflow-hidden border border-voyage-border/70 p-0.5">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-voyage-navy via-slate-800 to-voyage-gold transition-all duration-1000 shadow-soft-xs"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-voyage-muted">
          <span>₹0</span>
          <span>Target: ₹{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
