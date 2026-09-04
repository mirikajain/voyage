import React from 'react';
import { Sparkles, ArrowRight, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CuratedDestinations: React.FC = () => {
  const { triggerAIPromptFromAnywhere, setCurrentPage } = useApp();

  const curated = [
    {
      title: 'Kyoto Zen & Ryokans',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      tag: 'Autumn Foliage',
      reason: 'Perfect for a slower autumn escape with traditional ryokan onsens.',
      prompt: 'Plan an 8-day luxury Kyoto & Tokyo cultural trip for ₹2,20,000',
    },
    {
      title: 'Amalfi Cliffside Villas',
      country: 'Italy',
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
      tag: 'Mediterranean Escapes',
      reason: 'Private cliffside stays & chartered catamaran day voyages.',
      prompt: 'Find private cliffside stays and yacht charters in Amalfi Coast',
    },
    {
      title: 'Parisian Gastronomy & Art',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      tag: 'Fine Dining & Louvre',
      reason: 'Curated 7-day culinary tasting menus & private museum tours.',
      prompt: 'Curate a 7-day culinary and museum itinerary in Paris under ₹1,50,000',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-voyage-gold/15 text-voyage-gold-dark">
              Inspiration
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
          </div>
          <h3 className="font-serif-luxury text-xl font-bold text-voyage-dark mt-1">
            Curated Inspiration
          </h3>
          <p className="text-xs text-voyage-muted">
            Autonomous itineraries vetted for seasonal weather & luxury comfort
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('explore')}
          className="text-xs font-semibold text-voyage-dark hover:text-voyage-gold-dark flex items-center gap-1 transition-colors group"
        >
          <span>Explore directory</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 3 Visual Destination Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {curated.map((dest, idx) => (
          <div
            key={idx}
            onClick={() => triggerAIPromptFromAnywhere(dest.prompt)}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-soft-xs hover:shadow-soft-md hover:-translate-y-1 border border-voyage-border/80 transition-all duration-300 h-56 flex flex-col justify-between p-4 sm:p-5 text-white"
          >
            {/* Full Destination Image */}
            <img 
              src={dest.image} 
              alt={dest.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark/95 via-voyage-dark/45 to-black/20 pointer-events-none" />

            {/* Top Tag & Location */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 inline-block">
                {dest.tag}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-200 font-medium px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md">
                <MapPin className="w-3 h-3 text-voyage-gold" />
                {dest.country}
              </span>
            </div>

            {/* Bottom Content Area */}
            <div className="relative z-10 space-y-1.5">
              <h4 className="font-serif-luxury text-lg font-bold leading-tight group-hover:text-voyage-gold transition-colors">
                {dest.title}
              </h4>
              
              <p className="text-[11px] text-slate-200 line-clamp-1 leading-snug">
                {dest.reason}
              </p>

              <div className="pt-1 flex items-center justify-between text-xs border-t border-white/15">
                <span className="text-[10px] text-slate-300 font-medium">
                  Auto-curated
                </span>
                <span className="flex items-center gap-1 font-semibold text-xs text-voyage-gold group-hover:brightness-110">
                  Ask AI <Sparkles className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
