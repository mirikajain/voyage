import React, { useState } from 'react';
import { Check, Circle, Loader2, Sparkles, ChevronDown, ChevronUp, Clock, ShieldCheck, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AgentControlCenter: React.FC = () => {
  const { workflowSteps, activityLogs, isAgentRunning, currentAIMode } = useApp();
  const [isLogExpanded, setIsLogExpanded] = useState(false);

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
