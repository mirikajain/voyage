import React from 'react';
import { Building2, Plane, Utensils, Compass, Car, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ExploreCategory } from '../../types';
import { ExploreCard } from './ExploreCard';
import { ItemEvaluationModal } from './ItemEvaluationModal';

export const ExploreView: React.FC = () => {
  const { exploreItems, activeExploreCategory, setActiveExploreCategory, triggerAIPromptFromAnywhere } = useApp();

  const categories: { id: ExploreCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'hotels', label: 'Hotels', icon: Building2 },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'activities', label: 'Activities', icon: Compass },
    { id: 'transport', label: 'Transport', icon: Car },
  ];

  const filteredItems = exploreItems.filter(item => item.category === activeExploreCategory);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-voyage-gold-dark">
              Curated Directory
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-voyage-dark">
            Explore Experiences
          </h1>
          <p className="text-xs sm:text-sm text-voyage-muted mt-1">
            Vetted luxury partners evaluated in real-time by the Voyage agent against your taste and itinerary budget.
          </p>
        </div>

        <button
          onClick={() => triggerAIPromptFromAnywhere('Recommend luxury private experiences and boutique stays for my next vacation')}
          className="px-4 py-2.5 rounded-2xl bg-white border border-voyage-border hover:border-voyage-gold/50 text-xs font-semibold text-voyage-dark flex items-center gap-2 shadow-soft-xs transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-voyage-gold" />
          <span>Ask AI to Filter</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeExploreCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveExploreCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-voyage-dark text-white shadow-soft-sm'
                  : 'bg-white border border-voyage-border/80 text-voyage-slate hover:border-voyage-gold/40 hover:bg-voyage-bg'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-voyage-gold' : 'text-voyage-muted'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Explore Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <ExploreCard key={item.id} item={item} />
        ))}
      </div>

      {/* Item Evaluation Modal */}
      <ItemEvaluationModal />
    </div>
  );
};
