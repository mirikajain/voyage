import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HomeHeader: React.FC = () => {
  const { userProfile, setCurrentPage, trips } = useApp();

  const upcomingTrip = trips.find(t => t.status === 'Upcoming') || trips[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      {/* Left Greeting */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h1 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-voyage-dark">
            {getGreeting()}, {userProfile.name.split(' ')[0]}
          </h1>
          <span className="inline-block w-2 h-2 rounded-full bg-voyage-gold animate-pulse" />
        </div>
        <p className="text-xs sm:text-sm text-voyage-muted font-normal">
          Here's what's happening with your travel today.
        </p>
      </div>

      {/* Right Trip & Live Context */}
      <div className="flex items-center gap-2.5 sm:gap-3 self-start sm:self-auto">
        {upcomingTrip && (
          <button 
            type="button"
            onClick={() => setCurrentPage('trips')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#FFFEFC] border border-voyage-border/80 text-xs font-medium text-voyage-slate hover:border-voyage-gold/50 hover:text-voyage-dark shadow-soft-xs hover:shadow-soft-sm transition-all group"
            title="Next scheduled trip details"
          >
            <Calendar className="w-3.5 h-3.5 text-voyage-gold group-hover:scale-105 transition-transform" />
            <span className="font-semibold text-voyage-dark">{upcomingTrip.destination}</span>
            <span className="text-voyage-muted/50">•</span>
            <span className="text-emerald-700 font-semibold">Starts in 5 days</span>
          </button>
        )}

        <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/[0.03] border border-voyage-border/60 text-[11px] text-voyage-muted font-medium">
          <MapPin className="w-3 h-3 text-voyage-gold" />
          <span>India Base · Vault Secured</span>
        </div>
      </div>
    </div>
  );
};
