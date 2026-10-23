import React from 'react';
import { Calendar, ArrowUpRight, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UpcomingTripCard: React.FC = () => {
  const { trips, setActiveTrip } = useApp();
  const goaTrip = trips.find(t => t.id === 'trip-goa-2026') || trips[0];

  if (!goaTrip) return null;

  const percentageSpent = Math.round((goaTrip.amountSpent / goaTrip.totalBudget) * 100);
  const remaining = goaTrip.totalBudget - goaTrip.amountSpent;

  return (
    <div className="bg-white rounded-3xl border border-voyage-border/80 p-6 sm:p-7 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 relative overflow-hidden">
      {/* Background Subtle Image Accent with luxury overlay */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        {/* Left Side: Destination Visual & Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative w-full sm:w-36 h-28 rounded-2xl overflow-hidden shadow-soft-sm flex-shrink-0 group">
            <img 
              src={goaTrip.image} 
              alt={goaTrip.destination}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark/70 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[11px] font-semibold text-white">
              <MapPin className="w-3 h-3 text-voyage-gold" />
              <span>{goaTrip.country}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-voyage-gold/15 text-voyage-gold-dark">
                Upcoming Trip
              </span>
              <span className="text-xs text-voyage-muted font-medium">• {goaTrip.durationDays} days</span>
            </div>
            
            <h3 className="font-serif-luxury text-3xl font-bold tracking-wide text-voyage-dark">
              {goaTrip.destination}
            </h3>

            <div className="flex items-center gap-2 text-xs font-medium text-voyage-slate">
              <Calendar className="w-3.5 h-3.5 text-voyage-muted" />
              <span>{goaTrip.startDate} — {goaTrip.endDate}</span>
              <span className="text-voyage-lightMuted">•</span>
              <span className="text-emerald-700 font-semibold">Starts in 5 days</span>
            </div>
          </div>
        </div>

        {/* Right Side: Budget Gauge & Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:border-l lg:border-voyage-border/70 lg:pl-8">
          <div className="w-full sm:w-56 space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-voyage-muted font-medium">Trip Budget</span>
              <span className="font-semibold text-voyage-dark">
                ₹{goaTrip.amountSpent.toLocaleString()} <span className="text-voyage-muted font-normal">/ ₹{goaTrip.totalBudget.toLocaleString()}</span>
              </span>
            </div>

            {/* Custom Luxury Progress Bar */}
            <div className="w-full h-2.5 bg-voyage-bg rounded-full overflow-hidden border border-voyage-border/50">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-voyage-navy via-slate-800 to-voyage-gold transition-all duration-700"
                style={{ width: `${percentageSpent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-voyage-muted">{percentageSpent}% utilized</span>
              <span className="text-emerald-700 font-semibold">₹{remaining.toLocaleString()} remaining</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTrip(goaTrip)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-voyage-dark hover:bg-voyage-slate text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-soft-xs transition-all duration-200"
          >
            <span>View trip</span>
            <ArrowUpRight className="w-4 h-4 text-voyage-gold" />
          </button>
        </div>
      </div>
    </div>
  );
};
