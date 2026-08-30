import React from 'react';
import { Star, Sparkles, MapPin } from 'lucide-react';
import type { ExploreItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface ExploreCardProps {
  item: ExploreItem;
}

export const ExploreCard: React.FC<ExploreCardProps> = ({ item }) => {
  const { setActiveEvaluationItem } = useApp();

  return (
    <div className="group bg-white rounded-3xl border border-voyage-border/80 overflow-hidden shadow-soft-sm hover:shadow-soft-md hover:border-voyage-gold/40 transition-all duration-300 flex flex-col justify-between">
      {/* Image Header */}
      <div className="relative h-56 w-full overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark/75 via-transparent to-black/20" />

        {/* AI Match Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-voyage-dark/85 text-voyage-gold text-xs font-bold shadow-soft-xs backdrop-blur-md border border-voyage-gold/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{item.matchScore}% Match</span>
        </div>

        {/* Rating */}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-voyage-dark text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{item.rating}</span>
          <span className="text-[10px] text-voyage-muted font-normal">({item.reviewCount})</span>
        </div>

        {/* Location & Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-1 text-slate-200 text-xs font-medium mb-0.5">
            <MapPin className="w-3.5 h-3.5 text-voyage-gold" />
            <span>{item.location}</span>
          </div>
          <h3 className="font-serif-luxury text-2xl font-bold text-white tracking-wide line-clamp-1">
            {item.name}
          </h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 space-y-4 flex flex-col justify-between flex-grow">
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-voyage-muted leading-relaxed line-clamp-2">
            {item.shortDescription}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-voyage-bg text-voyage-slate border border-voyage-border/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Ask Voyage Action */}
        <div className="pt-4 border-t border-voyage-border/60 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-voyage-muted font-medium block">Curated Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-voyage-dark">
                {item.currency}{item.price.toLocaleString()}
              </span>
              <span className="text-[11px] text-voyage-muted">/ {item.priceUnit}</span>
            </div>
          </div>

          {/* Signature "Ask Voyage" Button */}
          <button
            onClick={() => setActiveEvaluationItem(item)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-voyage-dark to-slate-800 hover:from-slate-900 hover:to-voyage-dark text-white text-xs font-semibold flex items-center gap-2 shadow-soft-xs hover:shadow-gold-glow transition-all duration-200 border border-voyage-gold/30 group/btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-voyage-gold group-hover/btn:rotate-12 transition-transform" />
            <span>Ask Voyage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
