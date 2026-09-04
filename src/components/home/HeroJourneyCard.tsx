import React from 'react';
import { Calendar, MapPin, Sun, ArrowUpRight, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HeroJourneyCard: React.FC = () => {
  const { trips, setActiveTrip, triggerAIPromptFromAnywhere } = useApp();
  const nextTrip = trips.find(t => t.id === 'trip-goa-2026') || trips[0];

  if (!nextTrip) {
    return (
      <div className="bg-white rounded-3xl border border-voyage-border/80 p-8 shadow-soft-sm flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-voyage-gold-dark flex items-center justify-center mb-4 border border-voyage-gold/30">
          <Sparkles className="w-6 h-6 text-voyage-gold" />
        </div>
        <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark mb-2">
          Where should we take you next?
        </h3>
        <p className="text-xs text-voyage-muted max-w-sm mb-6">
          Set up a custom itinerary, flight monitoring, and luxury hotel reservations in seconds.
        </p>
        <button
          onClick={() => triggerAIPromptFromAnywhere('Plan a new luxury trip')}
          className="px-5 py-2.5 rounded-xl bg-voyage-dark hover:bg-voyage-slate text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-soft-sm"
        >
          <span>Ask Voyage</span>
          <Sparkles className="w-3.5 h-3.5 text-voyage-gold" />
        </button>
      </div>
    );
  }

  const remaining = nextTrip.totalBudget - nextTrip.amountSpent;
  const percentageSpent = Math.round((nextTrip.amountSpent / nextTrip.totalBudget) * 100);

  return (
    <div className="group relative rounded-3xl overflow-hidden border border-voyage-border/80 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 h-full min-h-[320px] flex flex-col justify-between p-6 sm:p-7 text-white">
      {/* Background Image */}
      <img
        src={nextTrip.image}
        alt={nextTrip.destination}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      {/* Refined Luxury Dark Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark/95 via-voyage-dark/60 to-voyage-dark/30 pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Your Next Journey
            </span>
            <span className="text-xs text-slate-200 font-medium">
              Starts in 5 days
            </span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-wide text-white pt-1">
            {nextTrip.destination}
          </h2>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-voyage-gold" />
              {nextTrip.country}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              {nextTrip.durationDays} days · {nextTrip.startDate} – {nextTrip.endDate}
            </span>
          </div>
        </div>

        {/* Weather Forecast Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-right">
          <Sun className="w-4 h-4 text-amber-300 flex-shrink-0" />
          <div className="text-left">
            <div className="text-xs font-bold leading-none text-white">29°C</div>
            <div className="text-[10px] text-slate-200 leading-tight">Coastal breeze</div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Progress and Metric Pills */}
      <div className="relative z-10 space-y-4 pt-6">
        {/* Budget Progress Gauge */}
        <div className="space-y-1.5 bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-voyage-gold" />
              Your trip is 81% within budget
            </span>
            <span className="text-emerald-400 font-bold text-xs">
              ₹{remaining.toLocaleString()} buffer
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-voyage-gold to-amber-300 transition-all duration-700"
              style={{ width: `${percentageSpent}%` }}
            />
          </div>
        </div>

        {/* Small Metric Pills + Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-3 gap-2 flex-1">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/15">
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                ₹{nextTrip.amountSpent.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-300 leading-tight">
                Current spend
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/15">
              <div className="text-xs sm:text-sm font-bold text-emerald-400 leading-tight">
                ₹{remaining.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-300 leading-tight">
                Remaining
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/15">
              <div className="text-xs sm:text-sm font-bold text-amber-200 leading-tight">
                {nextTrip.durationDays} days
              </div>
              <div className="text-[10px] text-slate-300 leading-tight">
                Duration
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTrip(nextTrip)}
            className="px-4 py-2.5 rounded-xl bg-white text-voyage-dark hover:bg-amber-50 text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft-sm transition-all duration-200 flex-shrink-0"
          >
            <span>View trip</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-voyage-gold-dark" />
          </button>
        </div>
      </div>
    </div>
  );
};
