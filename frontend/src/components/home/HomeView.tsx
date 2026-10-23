import React from 'react';
import { HomeHeader } from './HomeHeader';
import { HeroJourneyCard } from './HeroJourneyCard';
import { TravelMapCard } from './TravelMapCard';
import { AIIntelligenceCards } from './AIIntelligenceCards';
import { AgentStatusCard } from './AgentStatusCard';
import { FinancialSnapshotCard } from './FinancialSnapshotCard';
import { SpendingBreakdownCard } from './SpendingBreakdownCard';
import { CuratedDestinations } from './CuratedDestinations';

export const HomeView: React.FC = () => {
  return (
    <div className="space-y-7 sm:space-y-9 w-full pb-16 animate-in fade-in duration-300">
      {/* 1. Dashboard Header */}
      <HomeHeader />

      {/* 2. Primary Hero Grid: Next Journey + Travel Map (7:5 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <HeroJourneyCard />
        </div>
        <div className="lg:col-span-5">
          <TravelMapCard />
        </div>
      </div>

      {/* 3. AI Intelligence Visual Widgets Row */}
      <AIIntelligenceCards />

      {/* 4. Operations & Financial Snapshot Triad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Dark Obsidian Command Center Anchor */}
        <AgentStatusCard />
        {/* Warm Ivory Financial Snapshot */}
        <FinancialSnapshotCard />
        {/* Crisp Spending Data Visualization */}
        <SpendingBreakdownCard />
      </div>

      {/* 5. Curated Inspiration Full Grid */}
      <CuratedDestinations />
    </div>
  );
};
