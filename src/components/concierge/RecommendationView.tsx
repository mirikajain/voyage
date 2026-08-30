import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Hotel, Utensils, Compass, Car, Plane, SlidersHorizontal, Radio } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RecommendationView: React.FC = () => {
  const { activeRecommendationResult, setIsItineraryModalOpen, setIsAdjustBudgetModalOpen, isAgentRunning } = useApp();

  if (isAgentRunning && !activeRecommendationResult) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-voyage-border/80 shadow-soft-sm text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-voyage-gold-dark flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <div>
          <h4 className="font-serif-luxury text-xl font-bold text-voyage-dark">Synthesizing Your Trip Plan</h4>
          <p className="text-xs text-voyage-muted mt-1">Comparing live inventory across external travel services & partner networks...</p>
        </div>
      </div>
    );
  }

  if (!activeRecommendationResult) return null;

  const { planTitle, destination, durationDays, breakdown, reasons, isBudgetExceeded, dataSourceNotice, providerSummary } = activeRecommendationResult;
  const nights = Math.max(1, durationDays - 1);
  const hasUserBudget = breakdown.requestedBudget && breakdown.requestedBudget !== breakdown.totalEstimatedCost;

  return (
    <div className="bg-white rounded-3xl border border-voyage-gold/40 shadow-soft-md overflow-hidden space-y-6 p-6 sm:p-7 relative group">
      {/* Top Title & Estimated Cost Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-voyage-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-voyage-dark text-voyage-gold">
              AI Curated Plan
            </span>
            <span className="text-xs text-voyage-muted font-medium">• {durationDays} Days ({destination})</span>
            {providerSummary?.any_live && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                Live Rates
              </span>
            )}
          </div>
          <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-wide text-voyage-dark">
            {planTitle}
          </h3>
        </div>

        <div className="text-left sm:text-right bg-voyage-bg p-3.5 rounded-2xl border border-voyage-border/70 self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold text-voyage-muted block">Estimated Trip Total</span>
          <span className="font-serif-luxury text-2xl font-bold text-voyage-dark">
            ₹{breakdown.totalEstimatedCost.toLocaleString()}
          </span>
          <span className="text-[11px] text-voyage-muted block">{durationDays} days estimated</span>
        </div>
      </div>

      {/* Budget Comparison Banner */}
      <div className="p-4 rounded-2xl bg-voyage-bg border border-voyage-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-voyage-slate font-medium">
            {hasUserBudget ? 'Budget Ceiling: ' : 'Estimated Package Envelope: '}
            <span className="font-bold text-voyage-dark">
              ₹{(breakdown.requestedBudget || breakdown.totalEstimatedCost).toLocaleString()}
            </span>
          </span>
          <span className={isBudgetExceeded ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
            {isBudgetExceeded 
              ? `₹${(breakdown.totalEstimatedCost - (breakdown.requestedBudget || 0)).toLocaleString()} over budget`
              : (hasUserBudget ? `Remaining Buffer: ₹${breakdown.remainingBuffer.toLocaleString()}` : 'Optimal Budget Fit')
            }
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-voyage-border/60">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              isBudgetExceeded 
                ? 'bg-rose-500' 
                : 'bg-gradient-to-r from-voyage-navy via-slate-800 to-voyage-gold'
            }`}
            style={{ width: `${Math.min(100, Math.round((breakdown.totalEstimatedCost / (breakdown.requestedBudget || breakdown.totalEstimatedCost)) * 100))}%` }}
          />
        </div>
      </div>

      {/* Structured Category Cost Breakdown Cards with Live / Demo Badges */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">
            Estimated Expense Breakdown
          </p>
          <span className="text-[11px] text-voyage-muted">
            {durationDays} Days / {nights} {nights === 1 ? 'Night' : 'Nights'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Hotel */}
          <div className="p-3 rounded-2xl bg-voyage-bg/70 border border-voyage-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white border border-voyage-border text-amber-800">
                <Hotel className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-voyage-dark">Hotel ({breakdown.hotelName})</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    breakdown.hotelIsLive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {breakdown.hotelIsLive ? `Live · ${breakdown.hotelSource}` : 'Demo data'}
                  </span>
                </div>
                <p className="text-[10px] text-voyage-muted">{nights} {nights === 1 ? 'night' : 'nights'} curated accommodation</p>
              </div>
            </div>
            <span className="font-bold text-voyage-dark">₹{breakdown.hotelCost.toLocaleString()}</span>
          </div>

          {/* Dining */}
          <div className="p-3 rounded-2xl bg-voyage-bg/70 border border-voyage-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white border border-voyage-border text-rose-700">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-voyage-dark">Dining & Tastings</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    providerSummary?.restaurants?.is_live ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {providerSummary?.restaurants?.is_live ? `Live · ${providerSummary?.restaurants?.provider}` : 'Demo data'}
                  </span>
                </div>
                <p className="text-[10px] text-voyage-muted">Chef dinners & local dining</p>
              </div>
            </div>
            <span className="font-bold text-voyage-dark">₹{breakdown.diningCost.toLocaleString()}</span>
          </div>

          {/* Activities */}
          <div className="p-3 rounded-2xl bg-voyage-bg/70 border border-voyage-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white border border-voyage-border text-emerald-700">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-voyage-dark">Activities & Culture</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    providerSummary?.activities?.is_live ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {providerSummary?.activities?.is_live ? `Live · ${providerSummary?.activities?.provider}` : 'Demo data'}
                  </span>
                </div>
                <p className="text-[10px] text-voyage-muted">Guided highlights & excursions</p>
              </div>
            </div>
            <span className="font-bold text-voyage-dark">₹{breakdown.activitiesCost.toLocaleString()}</span>
          </div>

          {/* Transport */}
          <div className="p-3 rounded-2xl bg-voyage-bg/70 border border-voyage-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white border border-voyage-border text-voyage-blue-accent">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-voyage-dark">Local Transport</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    Demo data
                  </span>
                </div>
                <p className="text-[10px] text-voyage-muted">Executive transfers & transit pass</p>
              </div>
            </div>
            <span className="font-bold text-voyage-dark">₹{breakdown.transportCost.toLocaleString()}</span>
          </div>

          {/* Travel / Flights */}
          <div className="sm:col-span-2 p-3 rounded-2xl bg-voyage-bg/70 border border-voyage-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white border border-voyage-border text-slate-800">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-voyage-dark">Travel / Flights</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    breakdown.travelIsLive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {breakdown.travelIsLive ? `Live · ${breakdown.travelSource}` : 'Demo data'}
                  </span>
                </div>
                <p className="text-[10px] text-voyage-muted">Direct return flights ({destination})</p>
              </div>
            </div>
            <span className="font-bold text-voyage-dark">₹{breakdown.travelCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Attribution Notice */}
        <p className="text-[10px] text-voyage-muted italic text-center pt-1">
          {dataSourceNotice}
        </p>
      </div>

      {/* Why Voyage Recommends This */}
      <div className="p-4 rounded-2xl bg-amber-50/40 border border-voyage-gold/30 space-y-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-voyage-gold" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-voyage-dark">
            Why Voyage recommends this:
          </h4>
        </div>

        <ul className="space-y-1.5">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-voyage-slate leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* User Approval Footer */}
      <div className="pt-3 border-t border-voyage-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-voyage-dark">Ready to build this trip?</span>
          <span className="text-[11px] text-voyage-muted">Review before confirming</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setIsItineraryModalOpen(true)}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-soft-sm transition-all"
          >
            <span>Review itinerary</span>
            <ArrowRight className="w-4 h-4 text-voyage-gold" />
          </button>
          <button
            onClick={() => setIsAdjustBudgetModalOpen(true)}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-voyage-border hover:bg-voyage-bg text-xs font-semibold text-voyage-slate hover:text-voyage-dark flex items-center justify-center gap-2 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust budget</span>
          </button>
        </div>
      </div>
    </div>
  );
};
