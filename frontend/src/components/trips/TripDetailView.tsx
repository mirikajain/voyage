import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Users, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  PlusCircle, 
  MessageSquare, 
  XCircle, 
  FileText 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TripDetailView: React.FC = () => {
  const { setCurrentPage, setIsGlobalAIModalOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'Itinerary' | 'Bookings' | 'Expenses' | 'Documents' | 'Travelers' | 'Notes'>('Itinerary');
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  const tabs: ('Itinerary' | 'Bookings' | 'Expenses' | 'Documents' | 'Travelers' | 'Notes')[] = [
    'Itinerary', 'Bookings', 'Expenses', 'Documents', 'Travelers', 'Notes'
  ];

  return (
    <div className="space-y-6 w-full max-w-6xl pb-16">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
        <button
          type="button"
          onClick={() => setCurrentPage('trips')}
          className="inline-flex items-center gap-1 hover:text-[#121826] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Trips</span>
        </button>
        <span className="text-[#CBD5E1]">›</span>
        <span className="text-[#121826]">Goa</span>
      </nav>

      {/* 2. Hero Card */}
      <div 
        className="relative rounded-3xl overflow-hidden p-6 sm:p-8 min-h-[220px] flex flex-col justify-between text-white bg-cover bg-center shadow-xs"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%), url('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80')`
        }}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Upcoming
          </span>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121826]/75 hover:bg-[#121826] text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Trip</span>
          </button>
        </div>

        <div className="pt-6">
          <h1 className="font-serif-luxury text-4xl sm:text-5xl font-bold tracking-widest text-white">
            GOA
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-white/90">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-white/80" />
              <span>Sep 14 – Sep 18, 2024</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-white/80" />
              <span>4 Days • 2 Travelers</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-[#E5E0D5] text-sm overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-semibold transition-all relative cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-[#121826]'
                  : 'text-[#64748B] hover:text-[#121826]'
              }`}
            >
              <span>{tab}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#121826] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Two-Column Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Itinerary Accordions (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Day 1 Accordion */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
            <div 
              onClick={() => setExpandedDay(expandedDay === 1 ? null : 1)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-base text-[#121826]">Day 1</span>
                <span className="text-xs text-[#64748B]">Sat, Sep 14</span>
              </div>
              {expandedDay === 1 ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </div>

            {expandedDay === 1 && (
              <div className="mt-5 pl-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100 space-y-6">
                {/* Item 1: Flight */}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#64748B]">09:20 AM</span>
                      <p className="font-bold text-sm text-[#121826]">Flight to Goa</p>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">IndiGo 6E-241 • DEL → GOI</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex-shrink-0">
                    Confirmed
                  </span>
                </div>

                {/* Item 2: Airport Transfer */}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#64748B]">01:30 PM</span>
                      <p className="font-bold text-sm text-[#121826]">Airport Transfer</p>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">Private Cab</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex-shrink-0">
                    Confirmed
                  </span>
                </div>

                {/* Item 3: Hotel Check-in */}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#64748B]">02:00 PM</span>
                      <p className="font-bold text-sm text-[#121826]">Hotel Check-in</p>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">The Leela Goa</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex-shrink-0">
                    Confirmed
                  </span>
                </div>

                {/* Item 4: Sunset Cruise */}
                <div className="relative flex items-start justify-between gap-4">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#64748B]">Evening</span>
                      <p className="font-bold text-sm text-[#121826]">Sunset Cruise</p>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">6:00 PM - 8:00 PM</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold flex-shrink-0 transition-colors cursor-pointer"
                  >
                    View details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Day 2 Accordion */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
            <div 
              onClick={() => setExpandedDay(expandedDay === 2 ? null : 2)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-base text-[#121826]">Day 2</span>
                <span className="text-xs text-[#64748B]">Sun, Sep 15</span>
              </div>
              {expandedDay === 2 ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </div>
            {expandedDay === 2 && (
              <div className="mt-4 pt-3 border-t border-[#F0ECE4] text-xs text-[#64748B]">
                Latin Quarter walking tour, regional spice kitchen lunch, and Le Cinq dinner reservation.
              </div>
            )}
          </div>

          {/* Day 3 Accordion */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
            <div 
              onClick={() => setExpandedDay(expandedDay === 3 ? null : 3)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-base text-[#121826]">Day 3</span>
                <span className="text-xs text-[#64748B]">Mon, Sep 16</span>
              </div>
              {expandedDay === 3 ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </div>
            {expandedDay === 3 && (
              <div className="mt-4 pt-3 border-t border-[#F0ECE4] text-xs text-[#64748B]">
                South Goa Spice Plantation tour, river catamaran cruise, and Palolem beach sunset.
              </div>
            )}
          </div>

          {/* Day 4 Accordion */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
            <div 
              onClick={() => setExpandedDay(expandedDay === 4 ? null : 4)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-base text-[#121826]">Day 4</span>
                <span className="text-xs text-[#64748B]">Tue, Sep 17</span>
              </div>
              {expandedDay === 4 ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </div>
            {expandedDay === 4 && (
              <div className="mt-4 pt-3 border-t border-[#F0ECE4] text-xs text-[#64748B]">
                Resort spa morning and scheduled private transfer back to Goa Airport.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Overview, Quick Actions, Map (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Trip Overview */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
            <h3 className="font-bold text-sm text-[#121826] mb-3">Trip Overview</h3>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-[#121826]">₹32,400</span>
                <span className="text-xs text-[#94A3B8]">/ ₹40,000</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '81%' }} />
              </div>
              <div className="flex items-center justify-between text-xs text-[#64748B] pt-0.5">
                <span>81% spent</span>
                <span>81% spent</span>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs space-y-2.5">
            <h3 className="font-bold text-sm text-[#121826] mb-3">Quick Actions</h3>
            
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#E5E0D5] hover:bg-neutral-50 text-xs font-semibold text-[#121826] transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#64748B]" />
              <span>Modify Itinerary</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#E5E0D5] hover:bg-neutral-50 text-xs font-semibold text-[#121826] transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#64748B]" />
              <span>Add Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGlobalAIModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#E5E0D5] hover:bg-neutral-50 text-xs font-semibold text-[#121826] transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#C5A059]" />
              <span>Chat with Voyage</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#E5E0D5] hover:bg-neutral-50 text-xs font-semibold text-rose-600 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>Cancel Trip</span>
            </button>
          </div>

          {/* Card 3: Map Card */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] overflow-hidden shadow-xs">
            <div 
              className="h-36 bg-cover bg-center relative p-3 flex items-center justify-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80')`
              }}
            >
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#121826]">The Leela Goa</p>
                <p className="text-xs text-[#64748B]">Mobor, South Goa</p>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full border border-[#E5E0D5] hover:bg-neutral-50 text-xs font-semibold text-[#121826] transition-colors cursor-pointer"
              >
                View on map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
