import React from 'react';
import { Sparkles, ArrowRight, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CuratedDestinations: React.FC = () => {
  const { triggerAIPromptFromAnywhere, setCurrentPage } = useApp();

  const curated = [
    {
      title: 'Kyoto Zen & Ryokans',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
      tag: 'Autumn Foliage',
      prompt: 'Plan an 8-day luxury Kyoto & Tokyo cultural trip for ₹2,20,000',
    },
    {
      title: 'Amalfi Cliffside Villas',
      country: 'Italy',
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80',
      tag: 'Mediterranean Escapes',
      prompt: 'Find private cliffside stays and yacht charters in Amalfi Coast',
    },
    {
      title: 'Parisian Gastronomy & Art',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
      tag: 'Fine Dining & Louvre',
      prompt: 'Curate a 7-day culinary and museum itinerary in Paris under ₹1,50,000',
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif-luxury text-xl font-bold text-voyage-dark">
            Curated Inspiration
          </h3>
          <p className="text-xs text-voyage-muted">Autonomous itineraries vetted for seasonal weather & luxury comfort</p>
        </div>
        <button
          onClick={() => setCurrentPage('explore')}
          className="text-xs font-semibold text-voyage-dark hover:text-voyage-gold-dark flex items-center gap-1 transition-colors"
        >
          <span>Explore directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {curated.map((dest, idx) => (
          <div
            key={idx}
            onClick={() => triggerAIPromptFromAnywhere(dest.prompt)}
            className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-soft-xs hover:shadow-soft-md border border-voyage-border/60 transition-all duration-300 h-48 flex flex-col justify-end p-4 text-white"
          >
            <img 
              src={dest.image} 
              alt={dest.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 -z-10"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark/85 via-voyage-dark/40 to-transparent -z-10" />

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white inline-block">
                {dest.tag}
              </span>
              <h4 className="font-serif-luxury text-lg font-bold leading-tight group-hover:text-voyage-gold transition-colors">
                {dest.title}
              </h4>
              <div className="flex items-center justify-between text-xs text-slate-200">
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-voyage-gold" />
                  {dest.country}
                </span>
                <span className="flex items-center gap-1 font-medium text-[11px] text-voyage-gold">
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
