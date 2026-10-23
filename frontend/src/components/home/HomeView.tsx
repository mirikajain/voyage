import React from 'react';
import { 
  Clock, 
  Calendar, 
  CloudSun, 
  ArrowRight, 
  Plane, 
  Building, 
  Ticket, 
  ShieldCheck, 
  Car, 
  UtensilsCrossed, 
  Luggage, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HomeView: React.FC = () => {
  const { setCurrentPage, setIsGlobalAIModalOpen } = useApp();

  return (
    <div className="space-y-6 w-full max-w-6xl pb-12">
      {/* 1. Header Greeting */}
      <div>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#121826] tracking-tight">
          Good evening, Advait 👋
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] mt-1 font-normal">
          Your next journey to Goa starts in 5 days. Here's everything you need to know.
        </p>
      </div>

      {/* 2. Hero Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Hero: Goa Card (7 cols) */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden shadow-xs min-h-[320px] flex flex-col justify-between p-6 bg-cover bg-center text-white"
             style={{ 
               backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%), url('https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80')` 
             }}>
          {/* Top Row: NEXT TRIP Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wider uppercase text-white border border-white/30">
              <Clock className="w-3.5 h-3.5" />
              NEXT TRIP
            </span>
          </div>

          {/* Center Info: GOA & Dates */}
          <div className="my-auto pt-4">
            <h2 className="font-serif-luxury text-4xl sm:text-5xl font-bold tracking-widest text-white drop-shadow-sm">
              GOA
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-white/90">
              <Calendar className="w-4 h-4 text-white/80" />
              <span>Sep 14 - Sep 18, 2024</span>
            </div>
          </div>

          {/* Bottom Row: CTAs & Weather Badge */}
          <div className="flex flex-wrap items-end justify-between gap-3 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage('trip-detail')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#121826] font-semibold text-sm shadow-sm hover:bg-neutral-100 transition-all cursor-pointer"
              >
                <span>View itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsGlobalAIModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#121826]/75 hover:bg-[#121826] text-white font-medium text-sm backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              >
                <span>Chat with Voyage</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weather Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 text-xs text-white">
              <CloudSun className="w-5 h-5 text-amber-300" />
              <div>
                <p className="font-bold leading-tight">29°C</p>
                <p className="text-[10px] text-white/80 leading-tight">Partly Cloudy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Upcoming Today (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#ECE7DC] p-5 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="font-bold text-base text-[#121826] mb-4">Upcoming Today</h3>

            {/* Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-100">
              {/* Event 1 */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-6 w-7 h-7 rounded-full bg-blue-50 text-blue-600 border-2 border-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#121826] leading-tight">2:00 PM</p>
                  <p className="text-xs font-medium text-[#4B5563] mt-0.5">Hotel Check-in</p>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                    The Leela Goa<br />
                    Mobor, South Goa
                  </p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-6 w-7 h-7 rounded-full bg-blue-50 text-blue-600 border-2 border-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#121826] leading-tight">1:30 PM</p>
                  <p className="text-xs font-medium text-[#4B5563] mt-0.5">Cab pickup confirmed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom View All Link */}
          <button 
            type="button"
            onClick={() => setCurrentPage('trip-detail')}
            className="w-full pt-3 mt-4 border-t border-[#F0ECE4] text-center text-xs font-semibold text-[#121826] hover:text-[#C5A059] flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Four Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
          <p className="text-2xl font-bold text-[#121826] tracking-tight">₹32,400</p>
          <p className="text-xs text-[#64748B] font-medium mt-1">Total Spend</p>
          <span className="inline-block mt-3 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
            81% of budget
          </span>
        </div>

        {/* Remaining */}
        <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
          <p className="text-2xl font-bold text-[#121826] tracking-tight">₹7,600</p>
          <p className="text-xs text-[#64748B] font-medium mt-1">Remaining</p>
          <span className="inline-block mt-3 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
            Optimal pace
          </span>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
          <p className="text-2xl font-bold text-[#121826] tracking-tight">4 days</p>
          <p className="text-xs text-[#64748B] font-medium mt-1">Duration</p>
          <p className="mt-3 text-xs text-[#64748B] font-medium">
            Sep 14 - Sep 18
          </p>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs">
          <p className="text-2xl font-bold text-[#121826] tracking-tight">3 bookings</p>
          <p className="text-xs text-[#64748B] font-medium mt-1">Confirmed</p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Plane className="w-3 h-3" />
            </span>
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
              <Building className="w-3 h-3" />
            </span>
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Ticket className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 4. Personalized for you */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-[#121826]">Personalized for you</h3>
          <button 
            type="button" 
            onClick={() => setCurrentPage('explore')}
            className="text-xs font-medium text-[#64748B] hover:text-[#121826] flex items-center gap-1 cursor-pointer"
          >
            <span>See all insights</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-4 flex items-center gap-3 shadow-xs hover:border-[#C5A059]/40 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#121826] leading-snug">Add travel insurance</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Recommended</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-4 flex items-center gap-3 shadow-xs hover:border-[#C5A059]/40 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#121826] leading-snug">Arrange airport transfer</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Checklist</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-4 flex items-center gap-3 shadow-xs hover:border-[#C5A059]/40 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#121826] leading-snug">Best restaurants in Goa</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Curated for you</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl border border-[#ECE7DC] p-4 flex items-center gap-3 shadow-xs hover:border-[#C5A059]/40 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Luggage className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#121826] leading-snug">Packing checklist</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">View list</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: AI Insight + Explore experiences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: AI Insight (7 cols) */}
        <div className="lg:col-span-7 bg-[#EEEDFC] rounded-2xl border border-[#DCD9F8] p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-indigo-700">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm">AI Insight</span>
            </div>
            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed mt-2.5">
              Your hotel check-in is tomorrow at 2:00 PM. You may reach early and enjoy the resort facilities.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage('trip-detail')}
            className="self-end mt-3 text-xs font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Explore experiences in Goa (5 cols) */}
        <div 
          onClick={() => setCurrentPage('explore')}
          className="lg:col-span-5 rounded-2xl overflow-hidden relative p-5 flex items-center justify-between text-white bg-cover bg-center shadow-xs cursor-pointer group"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(18,24,38,0.92) 0%, rgba(18,24,38,0.4) 100%), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80')`
          }}
        >
          <div>
            <h4 className="font-serif-luxury text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
              Explore experiences in Goa
            </h4>
            <p className="text-xs text-white/80 mt-0.5 mb-3 font-normal">
              Handpicked for your taste
            </p>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#E8C782] text-[#E8C782] text-xs font-medium group-hover:bg-[#E8C782] group-hover:text-[#121826] transition-all">
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
