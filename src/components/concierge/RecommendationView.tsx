import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Hotel, 
  Utensils, 
  Compass, 
  Car, 
  Plane, 
  SlidersHorizontal, 
  Radio, 
  ShieldCheck, 
  Lock, 
  XCircle,
  CreditCard,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SearchResultsView } from './SearchResultsView';

export const RecommendationView: React.FC = () => {
  const { 
    activeRecommendationResult, 
    setIsItineraryModalOpen, 
    setIsAdjustBudgetModalOpen, 
    isAgentRunning,
    handleApprovePayment,
    handleRejectPayment,
    setCurrentPage,
    triggerAIPromptFromAnywhere
  } = useApp();

  const [showApprovalCard, setShowApprovalCard] = useState(false);

  if (isAgentRunning && !activeRecommendationResult) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-voyage-border/80 shadow-soft-sm text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-voyage-gold-dark flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <div>
          <h4 className="font-serif-luxury text-xl font-bold text-voyage-dark">Synthesizing Your Options</h4>
          <p className="text-xs text-voyage-muted mt-1">Checking live partner inventory & spend guardrails...</p>
        </div>
      </div>
    );
  }

  if (!activeRecommendationResult) return null;

  // If the user's intent is a specific search query (flights, hotels, restaurants, activities), render the dedicated search results view
  if (
    activeRecommendationResult.intent &&
    activeRecommendationResult.intent !== 'trip_planning' &&
    activeRecommendationResult.searchResults
  ) {
    return <SearchResultsView result={activeRecommendationResult} />;
  }

  const { 
    planTitle, 
    destination, 
    durationDays, 
    breakdown, 
    reasons, 
    isBudgetExceeded, 
    dataSourceNotice, 
    providerSummary,
    paymentStatus,
    paymentReference,
    paymentConfirmation
  } = activeRecommendationResult;

  const categoryStatus = activeRecommendationResult.categoryStatus || breakdown.categoryStatus || {};

  const nights = Math.max(1, durationDays - 1);
  const hasUserBudget = Boolean(breakdown.requestedBudget && breakdown.requestedBudget > 0);
  const isPaid = paymentStatus === 'paid';
  const isCancelled = paymentStatus === 'cancelled';

  const onBookClick = () => {
    setShowApprovalCard(true);
  };

  const onApproveConfirm = () => {
    if (handleApprovePayment) {
      handleApprovePayment();
    }
  };

  const onCancelApproval = () => {
    setShowApprovalCard(false);
    if (handleRejectPayment) {
      handleRejectPayment();
    }
  };

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
            {isPaid && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check className="w-3 h-3 text-emerald-700" />
                BOOKED & CONFIRMED
              </span>
            )}
            {!isPaid && providerSummary?.any_live && (
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-voyage-dark">Hotel ({breakdown.hotelName})</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    breakdown.hotelIsLive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {breakdown.hotelIsLive ? `Live · ${breakdown.hotelSource}` : 'Demo data'}
                  </span>
                  {categoryStatus?.hotel && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      categoryStatus.hotel === 'Hotel budget too low'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {categoryStatus.hotel}
                    </span>
                  )}
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-voyage-dark">Dining & Tastings</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    providerSummary?.restaurants?.is_live ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {providerSummary?.restaurants?.is_live ? `Live · ${providerSummary?.restaurants?.provider}` : 'Demo data'}
                  </span>
                  {categoryStatus?.dining && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      {categoryStatus.dining}
                    </span>
                  )}
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-voyage-dark">Activities & Culture</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    providerSummary?.activities?.is_live ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {providerSummary?.activities?.is_live ? `Live · ${providerSummary?.activities?.provider}` : 'Demo data'}
                  </span>
                  {categoryStatus?.activities && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      {categoryStatus.activities}
                    </span>
                  )}
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-voyage-dark">Local Transport</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    Demo data
                  </span>
                  {categoryStatus?.transport && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      {categoryStatus.transport}
                    </span>
                  )}
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-voyage-dark">Travel / Flights</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    breakdown.travelIsLive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {breakdown.travelIsLive ? `Live · ${breakdown.travelSource}` : 'Demo data'}
                  </span>
                  {categoryStatus?.flights && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      {categoryStatus.flights}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-voyage-muted">Direct return flights ({destination})</p>
              </div>
            </div>
            <span className="font-bold text-voyage-dark">₹{breakdown.travelCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Hotel Budget Alert Banner if Hotel Budget Too Low */}
        {categoryStatus?.hotel === 'Hotel budget too low' && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Hotel Budget Notice</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              No suitable hotel was found within your specified hotel budget for this {durationDays}-day trip. The closest available boutique option has been selected.
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={() => triggerAIPromptFromAnywhere('Increase hotel stay budget to ₹15,000')}
                className="px-3 py-1.5 rounded-xl bg-voyage-dark text-white text-[11px] font-semibold hover:bg-voyage-slate transition-colors"
              >
                Increase Hotel Budget
              </button>
              <button
                onClick={() => triggerAIPromptFromAnywhere(`Find available hotels in ${destination}`)}
                className="px-3 py-1.5 rounded-xl bg-white border border-voyage-border text-voyage-dark text-[11px] font-semibold hover:bg-voyage-bg transition-colors"
              >
                Show Alternatives
              </button>
            </div>
          </div>
        )}

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

      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* PHASE 5 HUMAN APPROVAL & PAYMENT LAYER */}
      {/* ------------------------------------------------------------- */}

      {/* Card Option A: Trip is Booked & Confirmed */}
      {isPaid && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white space-y-4 border border-emerald-500/40 shadow-soft-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                ✦ TRIP CONFIRMED
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-emerald-300">
              Ref: {paymentConfirmation?.booking_reference || `${paymentReference}-BK`}
            </span>
          </div>

          <div>
            <h3 className="font-serif-luxury text-2xl font-bold text-white">
              Your {destination} trip is booked.
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {durationDays} days · ₹{breakdown.totalEstimatedCost.toLocaleString()} paid securely through Razorpay
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Hotel</span>
              <span className="font-semibold text-white truncate block">{breakdown.hotelName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Flight</span>
              <span className="font-semibold text-white truncate block">Direct ({destination})</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
              </span>
            </div>
          </div>

          {/* Simulated / Demo badge */}
          <p className="text-[10px] text-slate-400 italic text-center">
            * Simulated booking confirmation: Verified via Razorpay Test/Demo financial guardrail.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={() => setIsItineraryModalOpen(true)}
              className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Review itinerary</span>
            </button>
            <button
              onClick={() => setCurrentPage('trips')}
              className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-voyage-gold-dark via-voyage-gold to-amber-300 text-voyage-dark hover:brightness-105 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <span>View in My Trips</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Card Option B: Explicit Payment Approval Box */}
      {!isPaid && showApprovalCard && (
        <div className="p-5 rounded-2xl bg-voyage-dark text-white space-y-4 animate-in fade-in duration-200 border border-voyage-gold/60 shadow-soft-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-voyage-gold text-voyage-dark">
                <ShieldCheck className="w-4 h-4 font-bold" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-voyage-gold block">
                  Human-in-the-loop Guardrail
                </span>
                <h4 className="font-serif-luxury text-lg font-bold text-white">
                  Payment Approval Required
                </h4>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30">
              Razorpay Secure
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Ready to book your trip? Review the financial authorization below before proceeding to checkout.
          </p>

          {/* Authorization Breakdown */}
          <div className="bg-white/5 rounded-xl p-3.5 text-xs space-y-2 border border-white/10">
            <div className="flex justify-between">
              <span className="text-slate-400">Trip Package:</span>
              <span className="font-semibold text-white">{destination} · {durationDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hotel:</span>
              <span className="text-white font-medium">₹{breakdown.hotelCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Flights:</span>
              <span className="text-white font-medium">₹{breakdown.travelCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dining:</span>
              <span className="text-white font-medium">₹{breakdown.diningCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Activities:</span>
              <span className="text-white font-medium">₹{breakdown.activitiesCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transport:</span>
              <span className="text-white font-medium">₹{breakdown.transportCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/10">
              <span className="text-slate-300 font-bold">Total Estimated:</span>
              <span className="font-bold text-voyage-gold text-sm">₹{breakdown.totalEstimatedCost.toLocaleString()}</span>
            </div>
            {hasUserBudget && (
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="text-slate-400">Remaining Cushion:</span>
                <span className="text-emerald-400 font-semibold">₹{breakdown.remainingBuffer.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Guardrail Guarantee Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-voyage-gold" />
            <span>Deterministic spend guardrails verified. No charge made without explicit confirmation.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              onClick={onApproveConfirm}
              className="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-voyage-gold-dark via-voyage-gold to-amber-300 text-voyage-dark hover:brightness-105 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <CreditCard className="w-4 h-4 text-voyage-dark" />
              <span>Approve & Pay (Razorpay)</span>
            </button>
            <button
              onClick={onCancelApproval}
              className="w-full sm:w-1/3 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject / Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Option C: Budget Exceeded Warning (Blocking Payment) */}
      {!isPaid && !showApprovalCard && isBudgetExceeded && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                Spend Guardrail Blocked Booking
              </h4>
              <p className="text-[11px] text-rose-700">
                Total ₹{breakdown.totalEstimatedCost.toLocaleString()} exceeds your ceiling of ₹{(breakdown.requestedBudget || 0).toLocaleString()}.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={() => setIsAdjustBudgetModalOpen(true)}
              className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust budget</span>
            </button>
            <button
              onClick={() => setIsItineraryModalOpen(true)}
              className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl border border-rose-300 hover:bg-rose-100/60 text-xs font-semibold text-rose-900 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Review itinerary</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Option D: Standard Actions (Review & Book with Voyage) */}
      {!isPaid && !showApprovalCard && !isBudgetExceeded && (
        <div className="pt-3 border-t border-voyage-border/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-voyage-dark">Ready to book your trip?</span>
            <span className="text-[11px] text-voyage-muted">
              {isCancelled ? 'Approval cancelled • Itinerary preserved' : 'Review & authorize reservation'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={onBookClick}
              className="w-full sm:w-1/3 py-3 px-3 rounded-xl bg-gradient-to-r from-voyage-gold-dark via-voyage-gold to-amber-300 text-voyage-dark hover:brightness-105 text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft-sm transition-all group/btn"
            >
              <ShieldCheck className="w-4 h-4 text-voyage-dark group-hover/btn:scale-110 transition-transform" />
              <span>Approve & Pay</span>
            </button>
            <button
              onClick={() => setIsItineraryModalOpen(true)}
              className="w-full sm:w-1/3 py-3 px-3 rounded-xl border border-voyage-border hover:bg-voyage-bg text-xs font-semibold text-voyage-slate hover:text-voyage-dark flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Review itinerary</span>
              <ArrowRight className="w-3.5 h-3.5 text-voyage-gold" />
            </button>
            <button
              onClick={() => setIsAdjustBudgetModalOpen(true)}
              className="w-full sm:w-1/3 py-3 px-3 rounded-xl border border-voyage-border hover:bg-voyage-bg text-xs font-semibold text-voyage-slate hover:text-voyage-dark flex items-center justify-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-voyage-gold" />
              <span>Adjust budget</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
