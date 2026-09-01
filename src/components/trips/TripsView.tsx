import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TripCard } from './TripCard';
import { TripDetailModal } from './TripDetailModal';

export const TripsView: React.FC = () => {
  const { trips, triggerAIPromptFromAnywhere } = useApp();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingTrips = trips.filter(t => t.status === 'Upcoming' || t.status === 'Active Planning' || t.status === 'Booked');
  const pastTrips = trips.filter(t => t.status === 'Past');

  const displayedTrips = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-voyage-gold-dark">
              Travel Portfolio
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-voyage-dark">
            Your Trips
          </h1>
          <p className="text-xs sm:text-sm text-voyage-muted mt-1">
            Live itineraries, proactive expense balancing, and concierge reservation archives.
          </p>
        </div>

        <button
          onClick={() => triggerAIPromptFromAnywhere('Plan a new custom trip for me. Destination ideas: Switzerland or Tokyo.')}
          className="px-5 py-3 rounded-2xl bg-voyage-dark hover:bg-voyage-slate text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-soft-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-voyage-gold" />
          <span>Plan New Trip with AI</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-voyage-border/80 pb-3">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-voyage-dark text-white shadow-soft-xs'
              : 'text-voyage-muted hover:text-voyage-dark hover:bg-voyage-bg'
          }`}
        >
          Upcoming & Booked ({upcomingTrips.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'past'
              ? 'bg-voyage-dark text-white shadow-soft-xs'
              : 'text-voyage-muted hover:text-voyage-dark hover:bg-voyage-bg'
          }`}
        >
          Past Trips ({pastTrips.length})
        </button>
      </div>

      {/* Grid of Trip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedTrips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

      {/* Trip Details Modal (Triggered on click) */}
      <TripDetailModal />
    </div>
  );
};
