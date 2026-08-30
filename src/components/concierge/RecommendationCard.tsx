import React from 'react';
import { Star, MapPin, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { defaultRecommendation } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export const RecommendationCard: React.FC = () => {
  const { handleBookRecommendation } = useApp();
  const rec = defaultRecommendation;

  return (
    <div className="bg-white rounded-3xl border border-voyage-gold/40 shadow-soft-md overflow-hidden relative group">
      {/* Visual Header */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden">
        <img 
          src={rec.image} 
          alt={rec.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark via-voyage-dark/30 to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-voyage-dark/90 backdrop-blur-md text-voyage-gold text-xs font-bold border border-voyage-gold/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Top Curated Match</span>
        </div>

        <div className="absolute top-3 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-voyage-dark text-xs font-bold shadow-soft-xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{rec.rating}</span>
        </div>

        {/* Destination & Location */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-1 text-slate-200 text-xs font-medium mb-0.5">
            <MapPin className="w-3.5 h-3.5 text-voyage-gold" />
            <span>{rec.location}</span>
          </div>
          <h3 className="font-serif-luxury text-2xl font-bold text-white tracking-wide">
            {rec.title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Distance & Quick Info */}
        <div className="flex items-center justify-between text-xs text-voyage-slate">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-voyage-muted" />
            <span>{rec.distance}</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Verified Table Available
          </span>
        </div>

        {/* Why Voyage Recommends It */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">
            Why Voyage recommends it:
          </p>
          <ul className="space-y-1.5">
            {rec.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-voyage-slate leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price & Book Action */}
        <div className="pt-3 border-t border-voyage-border/70 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-voyage-muted block">Tasting Menu / 2 Guests</span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif-luxury text-2xl font-bold text-voyage-dark">
                {rec.currency}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleBookRecommendation(rec)}
            className="px-6 py-3 rounded-2xl bg-voyage-dark hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-soft-sm hover:shadow-gold-glow transition-all"
          >
            <span>Book</span>
            <ArrowRight className="w-4 h-4 text-voyage-gold" />
          </button>
        </div>
      </div>
    </div>
  );
};
