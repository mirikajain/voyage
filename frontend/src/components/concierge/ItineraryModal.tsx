import React from 'react';
import { X, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ItineraryModal: React.FC = () => {
  const { isItineraryModalOpen, setIsItineraryModalOpen, activeRecommendationResult } = useApp();

  if (!isItineraryModalOpen || !activeRecommendationResult) return null;

  const { planTitle, destination, durationDays, breakdown, itinerary } = activeRecommendationResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-voyage-dark/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-luxury border border-voyage-border overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-voyage-dark text-white p-6 sm:p-7 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-voyage-gold text-voyage-dark">
                Curated Itinerary
              </span>
              <span className="text-xs text-slate-300 font-medium">{durationDays} Days • {destination}</span>
            </div>
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-wide">
              {planTitle} Schedule
            </h3>
            <p className="text-xs text-slate-300">Total Estimated Cost: ₹{breakdown.totalEstimatedCost.toLocaleString()}</p>
          </div>

          <button
            onClick={() => setIsItineraryModalOpen(false)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Itinerary Days */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="space-y-6">
            {itinerary.map((day) => (
              <div 
                key={day.dayNumber} 
                className="p-5 rounded-2xl bg-voyage-bg border border-voyage-border/80 shadow-soft-xs space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-voyage-border/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-voyage-dark text-voyage-gold text-xs font-bold flex items-center justify-center">
                      {day.dayNumber}
                    </span>
                    <h4 className="font-serif-luxury text-lg font-bold text-voyage-dark">
                      DAY {day.dayNumber} — {day.dayTitle}
                    </h4>
                  </div>
                  <span className="text-[11px] text-voyage-muted font-medium">Estimated Schedule</span>
                </div>

                <div className="space-y-2.5">
                  {day.items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start justify-between text-xs p-3 rounded-xl bg-white border border-voyage-border/60 shadow-soft-xs hover:border-voyage-gold/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          {item.time && (
                            <span className="font-mono text-[11px] font-semibold text-voyage-muted flex items-center gap-1">
                              <Clock className="w-3 h-3 text-voyage-gold" />
                              {item.time}
                            </span>
                          )}
                          <span className="font-bold text-voyage-dark">{item.title}</span>
                        </div>
                        {item.location && (
                          <p className="text-[11px] text-voyage-muted ml-0 sm:ml-16">{item.location}</p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="font-bold text-voyage-dark">
                          {item.cost === 0 ? 'Included' : `₹${item.cost.toLocaleString()}`}
                        </span>
                        <p className="text-[10px] uppercase font-semibold text-voyage-muted">{item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-between border-t border-voyage-border/80">
            <p className="text-xs text-voyage-muted italic">Prices shown from simulated external travel providers</p>
            <button
              onClick={() => setIsItineraryModalOpen(false)}
              className="py-2.5 px-5 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
            >
              Close Itinerary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
