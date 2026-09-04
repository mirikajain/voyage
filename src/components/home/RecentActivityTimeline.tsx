import React from 'react';
import { CheckCircle2, History, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RecentActivityTimeline: React.FC = () => {
  const { setCurrentPage } = useApp();

  const activities = [
    {
      title: 'Compared 12 Goa hotels',
      time: '2 min ago',
      description: 'Filtered for boutique heritage properties with private pools',
    },
    {
      title: 'Optimized trip budget by ₹2,400',
      time: '18 min ago',
      description: 'Replaced standard airport transfer with executive EV rate',
    },
    {
      title: 'Checked flight availability',
      time: '32 min ago',
      description: 'Confirmed BOM → GOX IndiGo 6E-241 status on schedule',
    },
    {
      title: 'Confirmed hotel check-in',
      time: '1 hr ago',
      description: 'Early bag drop voucher logged for 11:30 AM arrival',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-voyage-border/80 p-5 sm:p-6 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-voyage-dark text-voyage-gold shadow-soft-xs">
              <History className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-voyage-dark leading-tight">
                Recent Voyage activity
              </h3>
              <p className="text-xs text-voyage-muted">
                Autonomous agent event stream
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Vertical Timeline */}
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-voyage-border/80">
          {activities.map((act, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Marker */}
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-xs font-semibold text-voyage-dark group-hover:text-voyage-gold-dark transition-colors">
                    {act.title}
                  </h4>
                  <span className="text-[10px] text-voyage-muted whitespace-nowrap">
                    {act.time}
                  </span>
                </div>
                <p className="text-[11px] text-voyage-muted mt-0.5 line-clamp-1 leading-snug">
                  {act.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-voyage-border/60">
        <button
          onClick={() => setCurrentPage('concierge')}
          className="w-full py-2 px-3 rounded-xl bg-voyage-bg hover:bg-amber-50/50 hover:border-voyage-gold/50 border border-voyage-border/80 text-xs font-semibold text-voyage-dark flex items-center justify-center gap-1.5 transition-all group"
        >
          <span>Open Agent Control Center</span>
          <ArrowRight className="w-3.5 h-3.5 text-voyage-gold-dark group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
