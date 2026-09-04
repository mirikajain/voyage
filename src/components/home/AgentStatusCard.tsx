import React from 'react';
import { Sparkles, CheckCircle2, Circle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AgentStatusCard: React.FC = () => {
  const { isAgentRunning, setCurrentPage } = useApp();

  const checklistItems = [
    { label: 'Flights checked', detail: 'IndiGo 6E-241 on schedule', done: true },
    { label: 'Hotel confirmed', detail: 'Ahilya by the Sea deposit settled', done: true },
    { label: 'Budget monitored', detail: '₹7,600 margin guarded', done: true },
    { label: 'Weather checked', detail: 'Coastal breeze · 29°C forecast', done: true },
    { label: 'Disruption radar', detail: 'Flight radar standby active', done: false },
  ];

  return (
    <div className="bg-[#111827] rounded-3xl border border-slate-800/90 p-5 sm:p-6 shadow-soft-md text-white flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Subtle Ambient Gold Glow in Dark Card */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-voyage-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-white/10 text-voyage-gold border border-white/10 shadow-soft-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h3 className="font-serif-luxury text-base sm:text-lg font-bold tracking-wider text-white">
              VOYAGE INTELLIGENCE
            </h3>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        <p className="text-xs text-slate-400 font-normal mb-4">
          Monitoring your journey
        </p>

        {/* Live Sentinel State Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {isAgentRunning ? 'Executing agent plan...' : 'Autonomous trip sentinel'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-voyage-gold uppercase tracking-wider">
            Live
          </span>
        </div>

        {/* Checklist */}
        <div className="space-y-2.5">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {item.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-voyage-gold animate-pulse flex-shrink-0" />
                )}
                <span className={`font-medium ${item.done ? 'text-slate-200' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider & Last Activity */}
      <div className="pt-4 mt-4 border-t border-slate-800/90 space-y-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-voyage-gold">
            Last activity
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 mt-0.5">
            <span>Flight availability checked</span>
            <span className="text-[11px] text-slate-400">2 min ago</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/50">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Razorpay guardrails active
          </span>
          <button
            onClick={() => setCurrentPage('concierge')}
            className="text-voyage-gold hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Control Center</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
