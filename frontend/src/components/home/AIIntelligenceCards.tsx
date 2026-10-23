import React from 'react';
import { TrendingUp, Clock, Tag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AIIntelligenceCards: React.FC = () => {
  const { 
    setCurrentPage, 
    triggerAIPromptFromAnywhere, 
    setIsRazorpayCheckoutOpen, 
    setActiveCheckoutItem 
  } = useApp();

  const handleReviewSaving = () => {
    setActiveCheckoutItem({
      title: 'Executive Electric Transfer (Save ₹1,200)',
      amount: 1800,
      currency: 'INR',
      description: 'Auto-reserved EV sedan transfer • Flight delay protected',
      category: 'Transport',
    });
    setIsRazorpayCheckoutOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-voyage-gold/15 text-voyage-gold-dark">
            AI Insights
          </span>
          <h3 className="font-serif-luxury text-lg font-bold text-voyage-dark">
            Proactive Intelligence
          </h3>
        </div>
        <span className="text-xs text-voyage-muted hidden sm:inline">
          Autonomous recommendations & schedule monitoring
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 — Budget intelligence (Visual Progress Indicator) */}
        <div className="bg-[#FAF7F2] rounded-3xl p-5 border border-voyage-border/80 shadow-soft-xs hover:shadow-soft-sm transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="p-1.5 rounded-xl bg-white text-emerald-700 border border-emerald-200/60 shadow-soft-xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                Optimal Pace
              </span>
            </div>

            <div className="mb-3">
              <div className="text-2xl sm:text-3xl font-serif-luxury font-bold text-voyage-dark leading-tight">
                ₹7,600
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Remaining cushion
              </div>
            </div>

            {/* Visual Budget Meter */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-white/80 border border-voyage-border/70">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-voyage-muted">Spent: <strong>₹32,400</strong></span>
                <span className="text-emerald-700 font-semibold">81% utilized</span>
              </div>
              <div className="w-full h-2 rounded-full bg-voyage-bg overflow-hidden flex">
                <div className="h-full bg-voyage-dark rounded-l-full" style={{ width: '81%' }} />
                <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: '19%' }} />
              </div>
              <p className="text-[10px] text-voyage-muted pt-0.5">
                Room identified for 1 additional dining experience
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-voyage-border/60">
            <button
              onClick={() => setCurrentPage('wallet')}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-amber-50/50 hover:border-voyage-gold/50 border border-voyage-border/80 text-xs font-semibold text-voyage-dark flex items-center justify-center gap-1.5 transition-all shadow-soft-xs group-hover:border-voyage-gold/40"
            >
              <span>View budget</span>
              <ArrowRight className="w-3.5 h-3.5 text-voyage-gold-dark group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2 — Upcoming priority (Visual Timeline Indicator) */}
        <div className="bg-[#FAF7F2] rounded-3xl p-5 border border-voyage-border/80 shadow-soft-xs hover:shadow-soft-sm transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="p-1.5 rounded-xl bg-white text-blue-700 border border-blue-200/60 shadow-soft-xs">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/60 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Confirmed
              </span>
            </div>

            <div className="mb-3">
              <div className="text-2xl sm:text-3xl font-serif-luxury font-bold text-voyage-dark leading-tight">
                2:00 PM
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Hotel check-in · Tomorrow
              </div>
            </div>

            {/* Visual Check-in Timeline */}
            <div className="p-3 rounded-2xl bg-white/80 border border-voyage-border/70 space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-voyage-dark">11:30 AM</span>
                  <span className="text-voyage-muted ml-1.5">Early bag drop confirmed</span>
                </div>
              </div>

              <div className="ml-1 border-l-2 border-dashed border-voyage-border h-2" />

              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-voyage-dark">02:00 PM</span>
                  <span className="text-voyage-muted ml-1.5">Ahilya by the Sea reception</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-voyage-border/60">
            <button
              onClick={() => triggerAIPromptFromAnywhere('Show me check-in details and early access confirmation for Ahilya by the Sea')}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-amber-50/50 hover:border-voyage-gold/50 border border-voyage-border/80 text-xs font-semibold text-voyage-dark flex items-center justify-center gap-1.5 transition-all shadow-soft-xs group-hover:border-voyage-gold/40"
            >
              <span>View itinerary</span>
              <ArrowRight className="w-3.5 h-3.5 text-voyage-gold-dark group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 3 — Smart saving (Before → After Comparison) */}
        <div className="bg-[#FAF7F2] rounded-3xl p-5 border border-voyage-border/80 shadow-soft-xs hover:shadow-soft-sm transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="p-1.5 rounded-xl bg-white text-voyage-gold-dark border border-voyage-gold/30 shadow-soft-xs">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-voyage-gold-dark border border-voyage-gold/30">
                Smart Saving
              </span>
            </div>

            <div className="mb-3">
              <div className="text-2xl sm:text-3xl font-serif-luxury font-bold text-voyage-dark leading-tight">
                ₹1,200
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-voyage-gold-dark">
                Potential saving
              </div>
            </div>

            {/* Before -> After Comparison */}
            <div className="p-3 rounded-2xl bg-white/80 border border-voyage-border/70 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-voyage-muted text-[11px]">Standard Taxi</span>
                <span className="line-through text-voyage-muted text-xs">₹3,000</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-voyage-border/40">
                <span className="font-semibold text-voyage-dark text-[11px]">Executive EV</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-700">₹1,800</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">40% OFF</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-voyage-border/60">
            <button
              onClick={handleReviewSaving}
              className="w-full py-2 px-3 rounded-xl bg-voyage-dark hover:bg-slate-900 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow-soft-xs group"
            >
              <span>Review saving</span>
              <ArrowRight className="w-3.5 h-3.5 text-voyage-gold group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
