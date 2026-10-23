import React from 'react';
import { AgentChatStream } from './AgentChatStream';
import { AgentControlCenter } from './AgentControlCenter';
import { ItineraryModal } from './ItineraryModal';
import { AdjustBudgetModal } from './AdjustBudgetModal';

export const ConciergeView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-voyage-gold-dark">
            Autonomous Agent Control Center
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-voyage-dark">
          AI Concierge Workspace
        </h1>
        <p className="text-xs sm:text-sm text-voyage-muted mt-1">
          Dynamic multi-step agent reasoning across external travel provider APIs with real-time budget telemetry.
        </p>
      </div>

      {/* Split Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* LEFT — Conversation & Recommendation (7 cols on lg) */}
        <div className="lg:col-span-7 h-[640px] lg:h-[760px]">
          <AgentChatStream />
        </div>

        {/* RIGHT — Agent Control Center Timeline & Activity Log (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <AgentControlCenter />
        </div>
      </div>

      {/* Interactive Itinerary Breakdown Modal */}
      <ItineraryModal />

      {/* Interactive Budget Adjustment Modal */}
      <AdjustBudgetModal />
    </div>
  );
};
