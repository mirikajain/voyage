import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CategorySpend {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export const SpendingBreakdownCard: React.FC = () => {
  const { setCurrentPage } = useApp();

  const categories: CategorySpend[] = [
    { name: 'Hotels', amount: 18000, percentage: 55, color: '#C5A059' }, // Voyage Gold
    { name: 'Flights', amount: 6800, percentage: 21, color: '#1E293B' },  // Voyage Navy
    { name: 'Food', amount: 4200, percentage: 13, color: '#E11D48' },     // Rose
    { name: 'Activities', amount: 2200, percentage: 7, color: '#0D9488' }, // Emerald
    { name: 'Transport', amount: 1200, percentage: 4, color: '#2563EB' }, // Blue
  ];

  const totalSpent = categories.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="bg-[#FFFEFC] rounded-3xl border border-voyage-border/80 p-5 sm:p-6 shadow-soft-xs hover:shadow-soft-md transition-all duration-300 flex flex-col justify-between h-full group">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-voyage-gold/15 text-voyage-gold-dark">
                Allocation
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
            </div>
            <h3 className="font-serif-luxury text-lg font-bold text-voyage-dark mt-1">
              Trip spending
            </h3>
            <p className="text-xs text-voyage-muted">
              Breakdown by travel category
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('wallet')}
            className="p-1.5 rounded-xl hover:bg-voyage-bg text-voyage-muted hover:text-voyage-dark transition-colors"
            title="Open Wallet"
          >
            <ArrowUpRight className="w-4 h-4 text-voyage-gold" />
          </button>
        </div>

        {/* Minimalist Multi-segment Horizontal Progress Bar */}
        <div className="my-4 space-y-1.5">
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-voyage-border/40 p-0.5">
            {categories.map((c, idx) => (
              <div
                key={idx}
                style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 hover:opacity-85"
                title={`${c.name}: ₹${c.amount.toLocaleString()} (${c.percentage}%)`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-voyage-muted px-1">
            <span>Utilized: <strong className="text-voyage-dark font-semibold">₹{totalSpent.toLocaleString()}</strong></span>
            <span>5 categories</span>
          </div>
        </div>

        {/* Category List */}
        <div className="space-y-2 pt-1">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-voyage-bg/70 transition-colors">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-medium text-voyage-dark">{cat.name}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-voyage-dark">
                  ₹{cat.amount.toLocaleString()}
                </span>
                <span className="text-[10px] text-voyage-muted font-normal w-7 text-right">
                  {cat.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-voyage-border/60">
        <button
          onClick={() => setCurrentPage('wallet')}
          className="w-full py-2 px-3 rounded-xl bg-voyage-bg/80 hover:bg-amber-50/50 hover:border-voyage-gold/50 border border-voyage-border/80 text-xs font-semibold text-voyage-dark flex items-center justify-center gap-1.5 transition-all shadow-soft-xs"
        >
          <span>View detailed wallet ledger</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-voyage-gold-dark" />
        </button>
      </div>
    </div>
  );
};
