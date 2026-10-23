import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  Users, 
  Sparkles, 
  ChevronDown, 
  Building2, 
  Plane, 
  UtensilsCrossed, 
  Compass, 
  Car, 
  Star, 
  Heart, 
  ArrowRight 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ExploreCategory, ExploreItem } from '../../types';
import { ItemEvaluationModal } from './ItemEvaluationModal';

export const ExploreView: React.FC = () => {
  const { exploreItems, activeExploreCategory, setActiveExploreCategory, setActiveEvaluationItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDates] = useState('Any dates');
  const [selectedBudget] = useState('Any budget');
  const [selectedTravelers] = useState('2 travelers');
  const [selectedSort] = useState('AI Recommended');

  const categories: { id: ExploreCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'hotels', label: 'Hotels', icon: Building2 },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed },
    { id: 'activities', label: 'Activities', icon: Compass },
    { id: 'transport', label: 'Transport', icon: Car },
  ];

  // Filter items by category and search
  const displayedItems = exploreItems.filter(item => {
    const matchesCat = activeExploreCategory === 'hotels' ? item.category === 'hotels' : item.category === activeExploreCategory;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 w-full max-w-6xl pb-16">
      {/* 1. Header */}
      <div>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#121826] tracking-tight">
          Explore Experiences
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Discover handpicked stays, flights, restaurants and activities curated by Voyage.
        </p>
      </div>

      {/* 2. Search & Filters Card */}
      <div className="bg-white rounded-2xl border border-[#ECE7DC] p-4 shadow-xs space-y-3.5">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search destinations, hotels, or experiences..."
            className="w-full h-11 pl-11 pr-4 bg-[#F8F6F1] border border-[#E5E0D5] rounded-full text-sm text-[#121826] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#C5A059]/30 transition-all"
          />
        </div>

        {/* 4 Dropdown Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Dates */}
          <div className="border border-[#E5E0D5] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-neutral-50 transition-colors">
            <div className="min-w-0">
              <span className="block text-[10px] text-[#94A3B8] font-medium uppercase">Dates</span>
              <div className="flex items-center gap-1.5 font-semibold text-[#121826] truncate">
                <Calendar className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                <span className="truncate">{selectedDates}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0 ml-1" />
          </div>

          {/* Budget */}
          <div className="border border-[#E5E0D5] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-neutral-50 transition-colors">
            <div className="min-w-0">
              <span className="block text-[10px] text-[#94A3B8] font-medium uppercase">Budget</span>
              <div className="flex items-center gap-1.5 font-semibold text-[#121826] truncate">
                <CreditCard className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                <span className="truncate">{selectedBudget}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0 ml-1" />
          </div>

          {/* Travelers */}
          <div className="border border-[#E5E0D5] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-neutral-50 transition-colors">
            <div className="min-w-0">
              <span className="block text-[10px] text-[#94A3B8] font-medium uppercase">Travelers</span>
              <div className="flex items-center gap-1.5 font-semibold text-[#121826] truncate">
                <Users className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                <span className="truncate">{selectedTravelers}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0 ml-1" />
          </div>

          {/* Sort By */}
          <div className="border border-[#E5E0D5] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-neutral-50 transition-colors">
            <div className="min-w-0">
              <span className="block text-[10px] text-[#94A3B8] font-medium uppercase">Sort by</span>
              <div className="flex items-center gap-1.5 font-semibold text-[#121826] truncate">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                <span className="truncate">{selectedSort}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0 ml-1" />
          </div>
        </div>
      </div>

      {/* 3. Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeExploreCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveExploreCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#121826] text-white shadow-xs'
                  : 'bg-white text-[#121826] border border-[#E5E0D5] hover:bg-[#F3F0EA]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Three-Column Grid of 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedItems.map((item: ExploreItem) => (
          <div 
            key={item.id}
            className="bg-white rounded-3xl border border-[#ECE7DC] overflow-hidden shadow-xs hover:shadow-soft-sm transition-all flex flex-col justify-between group"
          >
            {/* Top Image Banner */}
            <div 
              className="relative h-44 bg-cover bg-center p-3.5 flex flex-col justify-between"
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%), url('${item.image}')` }}
            >
              <div className="flex items-center justify-between">
                {item.matchScore >= 95 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold tracking-wide">
                    <Sparkles className="w-2.5 h-2.5" />
                    {item.matchScore}% Match
                  </span>
                ) : <span />}

                <button
                  type="button"
                  aria-label="Save item"
                  className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-white text-xs">
                <span className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium">
                  📍 {item.location}
                </span>
                <span className="flex items-center gap-1 font-bold text-xs bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                  <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                  {item.rating} ({item.reviewCount})
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-bold text-base text-[#121826] leading-tight group-hover:text-[#C5A059] transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  {item.location}
                </p>

                {/* Amenity tags */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {item.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#64748B] text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & View Details CTA */}
              <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between">
                <div>
                  <span className="text-base font-bold text-[#121826]">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-normal ml-1">
                    /{item.priceUnit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveEvaluationItem(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E5E0D5] bg-white hover:bg-neutral-50 text-xs font-semibold text-[#121826] shadow-2xs transition-all cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ItemEvaluationModal />
    </div>
  );
};
