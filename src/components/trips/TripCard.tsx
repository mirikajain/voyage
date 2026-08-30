import React from 'react';
import { Calendar, ArrowUpRight, CheckCircle, Sparkles, MapPin } from 'lucide-react';
import type { Trip } from '../../types';
import { useApp } from '../../context/AppContext';

interface TripCardProps {
  trip: Trip;
}

export const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const { setActiveTrip } = useApp();

  const percentageSpent = Math.round((trip.amountSpent / trip.totalBudget) * 100);
  const remaining = trip.totalBudget - trip.amountSpent;
  const isPast = trip.status === 'Past';

  const getStatusBadge = () => {
    switch (trip.status) {
      case 'Upcoming':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/90 text-white shadow-soft-xs backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Upcoming
          </span>
        );
      case 'Active Planning':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-voyage-dark/90 text-voyage-gold shadow-soft-xs backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-voyage-gold" />
            Active Planning
          </span>
        );
      case 'Past':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 backdrop-blur-md">
            <CheckCircle className="w-3 h-3 text-slate-300" />
            Completed
          </span>
        );
    }
  };

  return (
    <div 
      onClick={() => setActiveTrip(trip)}
      className="group bg-white rounded-3xl border border-voyage-border/80 overflow-hidden shadow-soft-sm hover:shadow-soft-md hover:border-voyage-gold/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Image Header */}
      <div className="relative h-52 w-full overflow-hidden">
        <img 
          src={trip.image} 
          alt={trip.destination}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark/80 via-voyage-dark/20 to-transparent" />
        
        {/* Status Tag */}
        <div className="absolute top-4 left-4">
          {getStatusBadge()}
        </div>

        {/* Destination & Country */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1 text-slate-200 text-xs font-medium mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-voyage-gold" />
              <span>{trip.country}</span>
            </div>
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
              {trip.destination}
            </h3>
          </div>
          <span className="text-xs font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
            {trip.durationDays} Days
          </span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-medium text-voyage-slate">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-voyage-muted" />
            <span>{trip.startDate} — {trip.endDate}</span>
          </div>
          <span className="text-[11px] text-voyage-muted italic">{trip.travelVibe}</span>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-voyage-muted font-medium">Trip Spend</span>
            <span className="font-semibold text-voyage-dark">
              ₹{trip.amountSpent.toLocaleString()} <span className="text-voyage-muted font-normal">/ ₹{trip.totalBudget.toLocaleString()}</span>
            </span>
          </div>

          <div className="w-full h-2 bg-voyage-bg rounded-full overflow-hidden border border-voyage-border/50">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isPast 
                  ? 'bg-slate-400' 
                  : percentageSpent > 90 
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                  : 'bg-gradient-to-r from-voyage-navy via-slate-700 to-voyage-gold'
              }`}
              style={{ width: `${Math.min(percentageSpent, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-voyage-muted">{percentageSpent}% used</span>
            <span className={remaining >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
              {remaining >= 0 ? `₹${remaining.toLocaleString()} left` : `₹${Math.abs(remaining).toLocaleString()} over budget`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-voyage-border/60 flex items-center justify-between text-xs">
          <span className="text-voyage-muted font-medium group-hover:text-voyage-dark transition-colors">
            {isPast ? 'View Past Summary' : 'View Detailed Dashboard'}
          </span>
          <div className="p-1.5 rounded-lg bg-voyage-bg group-hover:bg-voyage-dark group-hover:text-white transition-all text-voyage-dark">
            <ArrowUpRight className="w-4 h-4 text-voyage-gold" />
          </div>
        </div>
      </div>
    </div>
  );
};
