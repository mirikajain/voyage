import React from 'react';
import { AIInputCard } from './AIInputCard';
import { UpcomingTripCard } from './UpcomingTripCard';
import { VoyageInsights } from './VoyageInsights';
import { CuratedDestinations } from './CuratedDestinations';
import { useApp } from '../../context/AppContext';

export const HomeView: React.FC = () => {
  const { userProfile } = useApp();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-voyage-gold-dark">
            {getGreeting()}, {userProfile.name.split(' ')[0]}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-voyage-dark">
          Where are you going next?
        </h1>
        <p className="text-xs sm:text-sm text-voyage-muted max-w-xl">
          Your autonomous luxury travel and financial companion. Plan custom itineraries, lock in vetted experiences, and maintain precision budget governance.
        </p>
      </div>

      {/* Hero AI Input Card */}
      <AIInputCard />

      {/* Upcoming Trip Section */}
      <UpcomingTripCard />

      {/* Voyage Insights */}
      <VoyageInsights />

      {/* Curated Destinations */}
      <CuratedDestinations />
    </div>
  );
};
