import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Plane, Hotel, Utensils, Compass, Radio, Clock, MapPin, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AgentRecommendationResult } from '../../types';

interface SearchResultsViewProps {
  result: AgentRecommendationResult;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({ result }) => {
  const { setActiveCheckoutItem, setIsRazorpayCheckoutOpen } = useApp();
  const { planTitle, intent, destination, origin, reasons, searchResults, dataSourceNotice, providerSummary } = result;

  const items = searchResults?.items || [];
  const type = searchResults?.type || (intent === 'flight_search' ? 'flights' : (intent === 'hotel_search' ? 'hotels' : 'restaurants'));
  const isFlight = type === 'flights' || intent === 'flight_search';
  const isHotel = type === 'hotels' || intent === 'hotel_search';
  const isRestaurant = type === 'restaurants' || intent === 'restaurant_search';

  const handleItemSelect = (item: any) => {
    if (isFlight) {
      setActiveCheckoutItem({
        title: item.airline || `Flight to ${destination}`,
        amount: item.price || item.total_price || 5400,
        currency: 'INR',
        description: `Direct Flight Reservation • ${item.origin || origin} ➔ ${item.destination || destination} (${item.flight_number || 'Scheduled'})`,
        category: 'Flights',
      });
      setIsRazorpayCheckoutOpen(true);
    } else if (isHotel) {
      setActiveCheckoutItem({
        title: item.name || `Hotel in ${destination}`,
        amount: item.price_per_night || item.cost_per_night || item.total_price || 4200,
        currency: 'INR',
        description: `Boutique Stay Reservation • ${item.name} (${item.location || destination})`,
        category: 'Hotels',
      });
      setIsRazorpayCheckoutOpen(true);
    } else {
      setActiveCheckoutItem({
        title: item.name || `Reservation in ${destination}`,
        amount: item.cost || item.price || 1500,
        currency: 'INR',
        description: `Curated Booking • ${item.name} (${destination})`,
        category: isRestaurant ? 'Dining' : 'Activities',
      });
      setIsRazorpayCheckoutOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-voyage-gold/40 shadow-soft-md overflow-hidden space-y-6 p-6 sm:p-7 relative group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-voyage-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-voyage-dark text-voyage-gold flex items-center gap-1.5">
              {isFlight ? <Plane className="w-3 h-3" /> : (isHotel ? <Hotel className="w-3 h-3" /> : (isRestaurant ? <Utensils className="w-3 h-3" /> : <Compass className="w-3 h-3" />))}
              <span>{isFlight ? 'Flight Schedules' : (isHotel ? 'Hotels & Stays' : (isRestaurant ? 'Dining Venues' : 'Activities & Tours'))}</span>
            </span>
            {searchResults?.is_live && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                Live Rates
              </span>
            )}
          </div>
          <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-wide text-voyage-dark">
            {planTitle}
          </h3>
          <p className="text-xs text-voyage-muted mt-1">
            {isFlight ? `Found ${items.length} verified direct flight options` : `Found ${items.length} curated options in ${destination}`}
          </p>
        </div>

        <div className="bg-voyage-bg p-3 rounded-2xl border border-voyage-border/70 text-right self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold text-voyage-muted block">Provider Source</span>
          <span className="text-xs font-bold text-voyage-dark">
            {searchResults?.provider || providerSummary?.flights?.provider || 'Voyage Network'}
          </span>
          <span className={`text-[10px] font-semibold block ${searchResults?.is_live ? 'text-emerald-700' : 'text-slate-500'}`}>
            {searchResults?.is_live ? 'Live Data Feed' : 'Simulated Rates'}
          </span>
        </div>
      </div>

      {/* Result Cards List */}
      <div className="space-y-3">
        {items.map((item: any, idx: number) => {
          const itemPrice = item.price || item.total_price || item.cost || item.price_per_night || 5400;
          return (
            <div
              key={item.id || idx}
              className="p-4 rounded-2xl bg-voyage-bg/70 border border-voyage-border/70 hover:border-voyage-gold/60 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group/card"
            >
              {/* Left Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-voyage-dark">
                    {item.airline || item.name || 'Verified Option'}
                  </span>
                  {item.flight_number && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-voyage-dark text-white">
                      {item.flight_number}
                    </span>
                  )}
                  {item.rating && (
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {item.rating}
                    </span>
                  )}
                </div>

                {isFlight && (
                  <div className="flex items-center gap-4 text-xs text-voyage-slate pt-0.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-voyage-muted" />
                      <span className="font-semibold text-voyage-dark">{item.departure_time || '08:45 AM'}</span>
                      <span className="text-voyage-muted">➔</span>
                      <span className="font-semibold text-voyage-dark">{item.arrival_time || '10:05 AM'}</span>
                    </div>
                    <span className="text-voyage-muted">•</span>
                    <span>{item.duration || '2h 10m'}</span>
                    <span className="text-voyage-muted">•</span>
                    <span className="text-emerald-700 font-semibold">{item.stops === 0 ? 'Non-stop' : `${item.stops} stop`}</span>
                  </div>
                )}

                {!isFlight && item.location && (
                  <div className="flex items-center gap-1 text-xs text-voyage-muted">
                    <MapPin className="w-3.5 h-3.5 text-voyage-gold" />
                    <span>{item.location}</span>
                  </div>
                )}

                {item.cuisine && (
                  <p className="text-xs text-voyage-slate">
                    <span className="font-medium text-voyage-muted">Cuisine:</span> {item.cuisine}
                  </p>
                )}

                {item.amenities && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.amenities.slice(0, 3).map((am: string, aIdx: number) => (
                      <span key={aIdx} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-voyage-border text-voyage-slate">
                        {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Action & Price */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-voyage-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-voyage-muted block text-right">
                    {isHotel ? 'Per Night' : 'Fare'}
                  </span>
                  <span className="font-serif-luxury text-xl font-bold text-voyage-dark">
                    ₹{Number(itemPrice).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleItemSelect(item)}
                  className="px-4 py-2 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-soft-xs transition-all"
                >
                  <span>{isFlight ? 'Reserve Flight' : (isHotel ? 'Reserve Room' : 'Book Now')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-voyage-gold" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Why Voyage Recommends This */}
      <div className="p-4 rounded-2xl bg-amber-50/40 border border-voyage-gold/30 space-y-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-voyage-gold" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-voyage-dark">
            Why Voyage recommends these options:
          </h4>
        </div>

        <ul className="space-y-1.5">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-voyage-slate leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Attribution notice */}
      <p className="text-[10px] text-voyage-muted italic text-center pt-1">
        {dataSourceNotice}
      </p>
    </div>
  );
};
