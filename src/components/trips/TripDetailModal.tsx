import React from 'react';
import { X, Calendar, Plane, Building2, Sparkles, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TripDetailModal: React.FC = () => {
  const { activeTrip, setActiveTrip, triggerAIPromptFromAnywhere } = useApp();

  if (!activeTrip) return null;

  const percentageSpent = Math.round((activeTrip.amountSpent / activeTrip.totalBudget) * 100);
  const remaining = activeTrip.totalBudget - activeTrip.amountSpent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-voyage-dark/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl shadow-luxury border border-voyage-border overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Image */}
        <div className="relative h-60 sm:h-72 w-full flex-shrink-0">
          <img 
            src={activeTrip.image} 
            alt={activeTrip.destination}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark via-voyage-dark/40 to-black/30" />

          {/* Close button */}
          <button
            onClick={() => setActiveTrip(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header text */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-voyage-gold text-voyage-dark">
                  {activeTrip.status}
                </span>
                <span className="text-xs text-slate-300 font-medium">{activeTrip.travelVibe}</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold tracking-wide">
                {activeTrip.destination}, {activeTrip.country}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-200 mt-1">
                <Calendar className="w-3.5 h-3.5 text-voyage-gold" />
                <span>{activeTrip.startDate} — {activeTrip.endDate} ({activeTrip.durationDays} Days)</span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTrip(null);
                triggerAIPromptFromAnywhere(`Review and optimize my upcoming ${activeTrip.destination} itinerary`);
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-voyage-dark hover:bg-amber-50 text-xs font-bold flex items-center gap-2 shadow-soft-md transition-all self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-voyage-gold" />
              <span>Ask Voyage to Adjust</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Financial Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-voyage-bg border border-voyage-border/80">
            <div>
              <p className="text-[11px] font-semibold text-voyage-muted uppercase tracking-wider">Total Allocated Budget</p>
              <p className="font-serif-luxury text-2xl font-bold text-voyage-dark mt-0.5">₹{activeTrip.totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-voyage-muted uppercase tracking-wider">Committed / Spent</p>
              <p className="font-serif-luxury text-2xl font-bold text-slate-800 mt-0.5">
                ₹{activeTrip.amountSpent.toLocaleString()} <span className="text-xs text-voyage-muted font-sans font-normal">({percentageSpent}%)</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-voyage-muted uppercase tracking-wider">Remaining Buffer</p>
              <p className="font-serif-luxury text-2xl font-bold text-emerald-700 mt-0.5">₹{remaining.toLocaleString()}</p>
            </div>
          </div>

          {/* Logistics Cards (Flight & Hotel) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTrip.flightDetails && (
              <div className="p-5 rounded-2xl bg-white border border-voyage-border shadow-soft-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-voyage-blue-light text-voyage-blue-accent">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-voyage-dark">Inbound Flight</h4>
                      <p className="text-[11px] text-voyage-muted">{activeTrip.flightDetails.airline}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Confirmed</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-voyage-border/50 text-xs">
                  <div>
                    <p className="text-[10px] text-voyage-muted">Departure</p>
                    <p className="font-semibold text-voyage-dark">{activeTrip.flightDetails.departure}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-voyage-muted" />
                  <div className="text-right">
                    <p className="text-[10px] text-voyage-muted">Arrival</p>
                    <p className="font-semibold text-voyage-dark">{activeTrip.flightDetails.arrival}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTrip.hotelDetails && (
              <div className="p-5 rounded-2xl bg-white border border-voyage-border shadow-soft-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-50 text-voyage-gold-dark">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-voyage-dark">Boutique Residence</h4>
                      <p className="text-[11px] text-voyage-muted">{activeTrip.hotelDetails.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Reserved</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-voyage-border/50 text-xs">
                  <div>
                    <p className="text-[10px] text-voyage-muted">Check-In</p>
                    <p className="font-semibold text-voyage-dark">{activeTrip.hotelDetails.checkIn}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-voyage-muted">Room Type</p>
                    <p className="font-semibold text-voyage-dark truncate max-w-[140px]">{activeTrip.hotelDetails.roomType}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Itinerary Schedule Timeline */}
          {activeTrip.itinerary && activeTrip.itinerary.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-serif-luxury text-xl font-bold text-voyage-dark">
                Curated Daily Schedule
              </h3>
              <div className="space-y-4">
                {activeTrip.itinerary.map((day) => (
                  <div key={day.day} className="p-5 rounded-2xl border border-voyage-border bg-white shadow-soft-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-voyage-gold-dark">
                        Day {day.day} • {day.title}
                      </span>
                      <span className="text-[11px] text-voyage-muted font-medium">Autonomous sync active</span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {day.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between text-xs p-2.5 rounded-xl bg-voyage-bg/70 border border-voyage-border/50">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold text-voyage-muted">{item.time}</span>
                              <span className="font-semibold text-voyage-dark">{item.title}</span>
                            </div>
                            <p className="text-[11px] text-voyage-muted ml-14">{item.location}</p>
                          </div>
                          <span className="font-semibold text-voyage-dark">₹{item.cost.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
