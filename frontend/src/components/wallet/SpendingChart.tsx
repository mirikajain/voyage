import React from 'react';
import { Plane, Building2, Utensils, Compass, Car } from 'lucide-react';
import { mockSpendingCategories } from '../../data/mockData';

export const SpendingChart: React.FC = () => {
  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'Flights': return <Plane className="w-4 h-4" />;
      case 'Hotels': return <Building2 className="w-4 h-4" />;
      case 'Food': return <Utensils className="w-4 h-4" />;
      case 'Activities': return <Compass className="w-4 h-4" />;
      case 'Transport': return <Car className="w-4 h-4" />;
      default: return null;
    }
  };

  const totalSpent = mockSpendingCategories.reduce((acc, curr) => acc + curr.spent, 0);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark">
            Spending Breakdown
          </h3>
          <p className="text-xs text-voyage-muted">Autonomous category classification & budget adherence</p>
        </div>
        <span className="text-xs font-semibold text-voyage-dark">
          Total Logged: ₹{totalSpent.toLocaleString()}
        </span>
      </div>

      {/* Segmented Visual Stack Bar */}
      <div className="space-y-2">
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-voyage-bg border border-voyage-border/60">
          {mockSpendingCategories.map((cat, idx) => {
            const widthPct = (cat.spent / totalSpent) * 100;
            return (
              <div 
                key={idx}
                title={`${cat.name}: ₹${cat.spent.toLocaleString()} (${Math.round(widthPct)}%)`}
                className="h-full transition-all duration-500 hover:opacity-85 cursor-pointer relative group"
                style={{ width: `${widthPct}%`, backgroundColor: cat.color }}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
          {mockSpendingCategories.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-voyage-slate font-medium">{cat.name}</span>
              <span className="text-voyage-muted text-[11px]">({Math.round((cat.spent / totalSpent) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Category Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {mockSpendingCategories.map((cat) => {
          const isOver = cat.spent > cat.allocated;
          const pct = Math.round((cat.spent / cat.allocated) * 100);

          return (
            <div 
              key={cat.name}
              className="p-4 rounded-2xl bg-voyage-bg/70 border border-voyage-border/60 space-y-2.5 hover:border-voyage-gold/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white border border-voyage-border text-voyage-dark">
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-voyage-dark">{cat.name}</h4>
                    <span className="text-[10px] text-voyage-muted">Cap: ₹{cat.allocated.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-voyage-dark">₹{cat.spent.toLocaleString()}</span>
                  <span className={`text-[10px] font-semibold block ${isOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {isOver ? `+${pct - 100}% over allocated` : `${pct}% consumed`}
                  </span>
                </div>
              </div>

              {/* Progress bar per category */}
              <div className="w-full h-1.5 bg-voyage-border/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : 'bg-voyage-dark'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
