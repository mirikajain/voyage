import React from 'react';
import { Compass, MapPin, Utensils, IndianRupee, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TravelPreferences: React.FC = () => {
  const { userProfile } = useApp();

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-sm space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-voyage-bg border border-voyage-border text-voyage-dark">
          <Compass className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark">
            Travel Preferences
          </h3>
          <p className="text-xs text-voyage-muted">Personalizes the autonomous AI planning engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Travel Style */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-voyage-muted">
            <Sparkles className="w-3.5 h-3.5 text-voyage-gold" />
            <span>Travel Style</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {userProfile.travelStyle.map((style, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-voyage-bg border border-voyage-border text-xs font-medium text-voyage-dark"
              >
                {style}
              </span>
            ))}
          </div>
        </div>

        {/* Food Preferences */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-voyage-muted">
            <Utensils className="w-3.5 h-3.5 text-voyage-gold" />
            <span>Food Preferences</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {userProfile.foodPreferences.map((food, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-voyage-bg border border-voyage-border text-xs font-medium text-voyage-dark"
              >
                {food}
              </span>
            ))}
          </div>
        </div>

        {/* Preferred Destinations */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-voyage-muted">
            <MapPin className="w-3.5 h-3.5 text-voyage-gold" />
            <span>Preferred Destinations</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {userProfile.preferredDestinations.map((dest, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-voyage-bg border border-voyage-border text-xs font-medium text-voyage-dark"
              >
                {dest}
              </span>
            ))}
          </div>
        </div>

        {/* Typical Trip Budget */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-voyage-muted">
            <IndianRupee className="w-3.5 h-3.5 text-voyage-gold" />
            <span>Typical Trip Budget</span>
          </div>
          <div className="p-3.5 rounded-xl bg-voyage-bg border border-voyage-border flex items-center justify-between">
            <div>
              <span className="font-serif-luxury text-xl font-bold text-voyage-dark">
                ₹{userProfile.typicalTripBudget.toLocaleString()}
              </span>
              <p className="text-[11px] text-voyage-muted">Baseline per trip (configurable per itinerary)</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-voyage-gold-dark border border-voyage-gold/30">
              Luxury Tier
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
