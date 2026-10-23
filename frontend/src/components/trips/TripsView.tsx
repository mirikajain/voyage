import React, { useState } from 'react';
import { Plus, Calendar, ArrowRight, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TripsView: React.FC = () => {
  const { trips, setCurrentPage, setActiveTrip, triggerAIPromptFromAnywhere } = useApp();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Planning' | 'Completed' | 'Cancelled'>('Upcoming');

  const tabs: { id: 'Upcoming' | 'Planning' | 'Completed' | 'Cancelled'; label: string; count: number }[] = [
    { id: 'Upcoming', label: 'Upcoming', count: 2 },
    { id: 'Planning', label: 'Planning', count: 1 },
    { id: 'Completed', label: 'Completed', count: 3 },
    { id: 'Cancelled', label: 'Cancelled', count: 1 },
  ];

  const handleOpenTripDetail = (tripId: string) => {
    const selected = trips.find(t => t.id === tripId) || trips[0];
    setActiveTrip(selected);
    setCurrentPage('trip-detail');
  };

  return (
    <div className="space-y-6 w-full max-w-6xl pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#121826] tracking-tight">
            Your Trips
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            All your travel plans in one place. Manage, edit, and let Voyage help you plan better.
          </p>
        </div>

        <button
          onClick={() => triggerAIPromptFromAnywhere('Plan a new custom trip with AI')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#121826] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Plan New Trip with AI</span>
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#121826] text-white shadow-xs'
                  : 'bg-white text-[#121826] border border-[#E5E0D5] hover:bg-[#F3F0EA]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* 3. 2x2 Grid of Trip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: GOA */}
        <div className="bg-white rounded-3xl border border-[#ECE7DC] overflow-hidden shadow-xs flex flex-col justify-between">
          <div 
            className="relative h-48 bg-cover bg-center p-4 flex flex-col justify-between"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%), url('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80')` 
            }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Upcoming
              </span>
              <button 
                type="button" 
                aria-label="Save trip"
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h2 className="font-serif-luxury text-3xl font-bold tracking-widest text-white">GOA</h2>
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium">
                4 Days
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sep 14 – Sep 18, 2024</span>
              </div>
              <p className="font-semibold text-sm text-[#121826] mt-1">
                Coastal Serenity & Heritage
              </p>
            </div>

            {/* Spend progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#64748B] font-medium">Trip Spend</span>
                <span className="font-bold text-[#121826]">
                  ₹32,400 <span className="font-normal text-[#94A3B8]">/ ₹40,000</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '81%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5">
                <span className="text-[#64748B]">81% used</span>
                <span className="text-emerald-700 font-semibold">₹7,600 left</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-[#F0ECE4] flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt="Traveler 1"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                  alt="Traveler 2"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenTripDetail('trip-goa-2026')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E5E0D5] bg-white hover:bg-neutral-50 text-xs font-semibold text-[#121826] shadow-2xs transition-all cursor-pointer"
              >
                <span>View Itinerary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: PARIS */}
        <div className="bg-white rounded-3xl border border-[#ECE7DC] overflow-hidden shadow-xs flex flex-col justify-between">
          <div 
            className="relative h-48 bg-cover bg-center p-4 flex flex-col justify-between"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%), url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80')` 
            }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Planning
              </span>
              <button 
                type="button" 
                aria-label="Save trip"
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h2 className="font-serif-luxury text-3xl font-bold tracking-widest text-white">PARIS</h2>
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium">
                7 Days
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Oct 20 – Oct 27, 2024</span>
              </div>
              <p className="font-semibold text-sm text-[#121826] mt-1">
                Art, History & Culinary
              </p>
            </div>

            {/* Spend progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#64748B] font-medium">Trip Spend</span>
                <span className="font-bold text-[#121826]">
                  ₹1,32,400 <span className="font-normal text-[#94A3B8]">/ ₹1,50,000</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '88%' }} />
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5">
                <span className="text-[#64748B]">88% used</span>
                <span className="text-emerald-700 font-semibold">₹17,600 left</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-[#F0ECE4] flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt="Traveler 1"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                  alt="Traveler 2"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
                  alt="Traveler 3"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenTripDetail('trip-paris-2026')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E5E0D5] bg-white hover:bg-neutral-50 text-xs font-semibold text-[#121826] shadow-2xs transition-all cursor-pointer"
              >
                <span>Edit Trip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: BALI */}
        <div className="bg-white rounded-3xl border border-[#ECE7DC] overflow-hidden shadow-xs flex flex-col justify-between">
          <div 
            className="relative h-48 bg-cover bg-center p-4 flex flex-col justify-between"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%), url('https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80')` 
            }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-white text-[11px] font-semibold">
                Completed
              </span>
              <button 
                type="button" 
                aria-label="Save trip"
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h2 className="font-serif-luxury text-3xl font-bold tracking-widest text-white">BALI</h2>
            </div>
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Jun 10 – Jun 15, 2024</span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenTripDetail('trip-bali-2024')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E5E0D5] bg-white hover:bg-neutral-50 text-xs font-semibold text-[#121826] shadow-2xs transition-all cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4: TOKYO */}
        <div className="bg-white rounded-3xl border border-[#ECE7DC] overflow-hidden shadow-xs flex flex-col justify-between">
          <div 
            className="relative h-48 bg-cover bg-center p-4 flex flex-col justify-between"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%), url('https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80')` 
            }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[11px] font-semibold">
                Cancelled
              </span>
              <button 
                type="button" 
                aria-label="Save trip"
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-end justify-between">
              <h2 className="font-serif-luxury text-3xl font-bold tracking-widest text-white">TOKYO</h2>
            </div>
          </div>

          <div className="p-5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Mar 12 – Mar 18, 2024</span>
            </div>
            <p className="text-xs text-[#64748B] font-medium pt-1">
              Cancelled due to schedule change
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
