import React, { useState } from 'react';
import { 
  Check, 
  Circle, 
  Loader2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Plane, 
  Hotel, 
  Compass, 
  Clock3, 
  CheckCircle2, 
  XCircle, 
  Zap 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AgentControlCenter: React.FC = () => {
  const { 
    workflowSteps, 
    activityLogs, 
    isAgentRunning, 
    currentAIMode, 
    activeRecommendationResult,
    handleSimulateDisruption,
    handleResolveDisruption,
    setIsRazorpayCheckoutOpen,
    setActiveCheckoutItem
  } = useApp();
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [isSimulatingType, setIsSimulatingType] = useState<string | null>(null);

  const disruption = activeRecommendationResult?.disruptionRecovery;
  const isDisruptionActive = disruption?.disruption_detected && disruption.recovery_status === 'ready_for_review';
  const isDisruptionResolved = disruption && (disruption.recovery_status === 'approved' || disruption.recovery_status === 'rejected');

  const onTriggerSimulation = async (type: string) => {
    setIsSimulatingType(type);
    try {
      await handleSimulateDisruption(type);
    } finally {
      setIsSimulatingType(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-voyage-border/80 shadow-soft-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-voyage-dark text-voyage-gold shadow-soft-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-xl font-bold text-voyage-dark">
              Voyage is working
            </h3>
            <p className="text-xs text-voyage-muted">
              {currentAIMode === 'llm' 
                ? 'Autonomous LangGraph + Gemini AI' 
                : currentAIMode === 'fallback' 
                ? 'Autonomous LangGraph · Fallback Active' 
                : 'Autonomous LangGraph (Demo Mode)'}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60 shadow-soft-xs">
          <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isAgentRunning ? 'animate-ping' : ''}`} />
          <span>{currentAIMode === 'llm' ? 'Gemini Active' : 'Agent Active'}</span>
        </div>
      </div>

      {/* Proactive Disruption Simulation Trigger Bar */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Simulation Demo
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900">
            Disruption Agent
          </span>
        </div>

        <p className="text-[11px] text-amber-800/90 leading-relaxed">
          Simulate external provider cancellations to observe autonomous ripple-effect recovery & schedule adaptation:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onTriggerSimulation('flight_cancelled')}
            disabled={isAgentRunning}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200 text-xs font-medium text-amber-900 transition-all shadow-soft-2xs disabled:opacity-50"
          >
            {isSimulatingType === 'flight_cancelled' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            ) : (
              <Plane className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Flight Cancelled</span>
          </button>

          <button
            onClick={() => onTriggerSimulation('hotel_cancelled')}
            disabled={isAgentRunning}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200 text-xs font-medium text-amber-900 transition-all shadow-soft-2xs disabled:opacity-50"
          >
            {isSimulatingType === 'hotel_cancelled' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            ) : (
              <Hotel className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Hotel Cancelled</span>
          </button>

          <button
            onClick={() => onTriggerSimulation('activity_cancelled')}
            disabled={isAgentRunning}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200 text-xs font-medium text-amber-900 transition-all shadow-soft-2xs disabled:opacity-50"
          >
            {isSimulatingType === 'activity_cancelled' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            ) : (
              <Compass className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Activity Cancelled</span>
          </button>

          <button
            onClick={() => onTriggerSimulation('flight_delayed')}
            disabled={isAgentRunning}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200 text-xs font-medium text-amber-900 transition-all shadow-soft-2xs disabled:opacity-50"
          >
            {isSimulatingType === 'flight_delayed' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            ) : (
              <Clock3 className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Flight Delayed (3h)</span>
          </button>
        </div>
      </div>

      {/* Proactive Disruption Recovery Card */}
      {isDisruptionActive && disruption && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-amber-50/50 to-orange-50/70 border-2 border-rose-200/80 shadow-soft-sm space-y-4 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500 text-white shadow-soft-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  ⚠️ Disruption Detected
                </h4>
                <p className="text-[11px] text-rose-800 font-medium">
                  {disruption.disruption_type.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-200/70 text-rose-900">
              {disruption.is_simulation ? 'Simulated Webhook' : 'Live Alert'}
            </span>
          </div>

          <p className="text-xs text-rose-900/90 font-sans leading-relaxed bg-white/70 p-2.5 rounded-xl border border-rose-200/50">
            {disruption.disruption_reason}
          </p>

          {/* Replacement Comparison Box */}
          {disruption.selected_replacement && (
            <div className="space-y-2 bg-white/90 p-3 rounded-xl border border-rose-200/60 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-voyage-muted">
                Recommended Solution
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-voyage-dark">
                    {disruption.selected_replacement.name || disruption.selected_replacement.airline || disruption.selected_replacement.title}
                  </p>
                  <p className="text-[11px] text-voyage-muted">
                    {disruption.selected_replacement.departure_time || disruption.selected_replacement.location || 'Verified Replacement'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-voyage-dark">
                    ₹{Math.round(disruption.replacement_cost).toLocaleString()}
                  </p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    disruption.price_difference > 0 
                      ? 'bg-amber-100 text-amber-900' 
                      : disruption.price_difference < 0 
                      ? 'bg-emerald-100 text-emerald-900' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {disruption.price_difference > 0 
                      ? `+₹${Math.round(disruption.price_difference).toLocaleString()}` 
                      : disruption.price_difference < 0 
                      ? `-₹${Math.round(Math.abs(disruption.price_difference)).toLocaleString()}` 
                      : 'No extra cost'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Downstream Ripple Effects */}
          {disruption.affected_downstream_items && disruption.affected_downstream_items.length > 0 && (
            <div className="space-y-1.5 bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                Downstream Ripple Effects Adapted:
              </span>
              <div className="space-y-1 text-[11px] text-amber-900">
                {disruption.affected_downstream_items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item.impact_description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Authorization Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                if (!disruption) return;
                const priceDiff = disruption.price_difference ?? disruption.additional_cost ?? 0;

                if (priceDiff > 0) {
                  const repl = disruption.selected_replacement;
                  const affected = disruption.affected_item;
                  const origCost = disruption.original_item_cost || 7200;
                  const replCost = disruption.replacement_cost || 8400;
                  const replTitle = repl?.name || repl?.airline || repl?.title || 'IndiGo 6E 614';

                  setActiveCheckoutItem({
                    title: `Flight Replacement: ${replTitle}`,
                    amount: priceDiff,
                    currency: 'INR',
                    description: `Disruption replacement for ${affected?.title || 'flight'}`,
                    category: 'flight',
                    isDisruptionPayment: true,
                    originalBookingTitle: affected?.title || 'Original Booking',
                    originalBookingCost: origCost,
                    replacementTitle: replTitle,
                    replacementCost: replCost,
                    additionalCost: priceDiff,
                    route: `${activeRecommendationResult?.origin || 'Delhi'} → ${activeRecommendationResult?.destination || 'Goa'}`,
                    date: 'Sep 14',
                    time: repl?.departure_time || '10:30 AM',
                    carrier: replTitle,
                    disruptionType: disruption.disruption_type,
                  });
                  setIsRazorpayCheckoutOpen(true);
                } else {
                  handleResolveDisruption(true);
                }
              }}
              disabled={isAgentRunning}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Replacement</span>
            </button>
            <button
              onClick={() => handleResolveDisruption(false)}
              disabled={isAgentRunning}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}

      {/* Disruption Resolved Banner */}
      {isDisruptionResolved && disruption && (
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
          disruption.recovery_status === 'approved' 
            ? 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900 shadow-soft-xs' 
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {disruption.recovery_status === 'approved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600" />
              )}
              <span className="font-bold">
                {disruption.recovery_status === 'approved'
                  ? '✓ DISRUPTION RESOLVED'
                  : 'DISRUPTION UNRESOLVED'}
              </span>
            </div>
            <span className="font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {disruption.recovery_status === 'approved' ? 'Verified Confirmed' : 'Declined'}
            </span>
          </div>

          {disruption.recovery_status === 'approved' && (
            <div className="text-[11px] text-emerald-800 space-y-0.5 pt-0.5">
              <p>Replacement flight confirmed: <strong>IndiGo 6E 614</strong> (Delhi → Goa, Sep 14 · 10:30 AM)</p>
              <p className="text-[10px] text-emerald-700 font-medium">
                {disruption.price_difference > 0
                  ? `₹${Math.round(disruption.price_difference).toLocaleString()} paid via Razorpay · Itinerary & budget synced`
                  : disruption.price_difference < 0 
                  ? `₹${Math.round(Math.abs(disruption.price_difference)).toLocaleString()} saved · Itinerary updated`
                  : 'Confirmed within existing budget · Itinerary updated'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vertical Workflow Timeline */}
      <div className="space-y-3 pt-1">
        {workflowSteps.map((step, idx) => {
          const isComplete = step.status === 'complete';
          const isActive = step.status === 'active';
          const isWaiting = step.status === 'waiting';

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 ${
                isActive
                  ? 'bg-amber-50/70 border-voyage-gold/60 shadow-soft-xs'
                  : isComplete
                  ? 'bg-voyage-bg/70 border-voyage-border/60'
                  : 'bg-slate-50/40 border-slate-100 opacity-60'
              }`}
            >
              {/* Step Status Glyphs */}
              <div className="mt-0.5 flex-shrink-0">
                {isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-soft-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full bg-voyage-gold text-voyage-dark flex items-center justify-center shadow-soft-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">
                    <Circle className="w-2 h-2 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Step Text Details */}
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold ${
                    isComplete ? 'text-voyage-dark' : isActive ? 'text-voyage-gold-dark' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </h4>
                  <span className="text-[10px] text-voyage-muted font-mono">
                    0{idx + 1}/06
                  </span>
                </div>
                
                {isActive && step.activeDescription && (
                  <p className="text-[11px] text-voyage-gold-dark font-medium leading-relaxed animate-pulse">
                    {step.activeDescription}
                  </p>
                )}
                {isComplete && step.completedDescription && (
                  <p className="text-[11px] text-voyage-muted leading-relaxed">
                    {step.completedDescription}
                  </p>
                )}
                {isWaiting && (
                  <p className="text-[11px] text-slate-400">
                    Pending preceding workflow actions...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Gate Banner */}
      <div className="p-3.5 rounded-2xl bg-voyage-bg border border-voyage-border/70 flex items-center justify-between text-xs text-voyage-slate">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Safety Gate: User approval required before building trip</span>
        </div>
        <span className="font-semibold text-voyage-dark text-[11px]">Razorpay Ready</span>
      </div>

      {/* Collapsible Agent Activity Log */}
      <div className="border-t border-voyage-border/70 pt-3">
        <button
          onClick={() => setIsLogExpanded(!isLogExpanded)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-voyage-bg text-xs font-semibold text-voyage-slate hover:text-voyage-dark transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-voyage-gold-dark" />
            <span>Agent activity ({activityLogs.length} events)</span>
          </div>
          {isLogExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isLogExpanded && (
          <div className="mt-2.5 p-3.5 rounded-2xl bg-voyage-bg border border-voyage-border/80 space-y-2 max-h-52 overflow-y-auto font-mono text-[11px]">
            {activityLogs.length === 0 ? (
              <p className="text-voyage-muted text-xs font-sans">No activity events recorded yet.</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-voyage-slate leading-relaxed">
                  <div className="flex items-center gap-1 text-voyage-muted flex-shrink-0 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                  <span className="text-voyage-muted">—</span>
                  <span className={`font-sans ${
                    log.category === 'budget' 
                      ? 'text-amber-800 font-semibold' 
                      : log.category === 'complete' 
                      ? 'text-emerald-700 font-semibold' 
                      : log.category === 'disruption'
                      ? 'text-rose-700 font-semibold'
                      : 'text-voyage-dark'
                  }`}>
                    {log.event}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
