import React, { useState } from 'react';
import { Search, Sparkles, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TopNavbar: React.FC = () => {
  const { setCurrentPage, userProfile, triggerAIPromptFromAnywhere } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      triggerAIPromptFromAnywhere(searchQuery.trim());
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F6F1]/90 backdrop-blur-md border-b border-[#E8E4DC]/80 px-6 h-16 flex items-center justify-between gap-4">
      {/* Left: Brand Logo */}
      <div 
        onClick={() => setCurrentPage('home')}
        className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0 w-52"
      >
        <div className="w-8 h-8 rounded-lg bg-[#121826] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
          <span className="font-serif-luxury font-bold text-base tracking-widest text-[#E8C782]">V</span>
        </div>
        <span className="font-serif-luxury text-xl font-bold tracking-widest text-[#121826]">VOYAGE AI</span>
      </div>

      {/* Center: Wide AI Search Pill Input */}
      <div className="flex-1 max-w-xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
          <div className="absolute left-4 pointer-events-none text-[#9CA3AF]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask Voyage to plan your next trip..."
            className="w-full h-11 pl-11 pr-14 bg-white border border-[#E5E0D5] rounded-full text-sm text-[#121826] placeholder-[#9CA3AF] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]/30 focus:border-[#C5A059] transition-all"
          />
          <button
            type="submit"
            aria-label="Ask AI"
            className="absolute right-1.5 top-1.5 bottom-1.5 w-8 h-8 rounded-full bg-[#C5A059] hover:bg-[#B8924B] active:scale-95 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right: Notifications & User Avatar */}
      <div className="flex items-center justify-end gap-3 flex-shrink-0 w-52">
        <button
          type="button"
          onClick={() => setCurrentPage('notifications')}
          className="p-2 rounded-full hover:bg-black/5 text-[#4B5563] hover:text-[#121826] transition-colors relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C5A059]" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('profile')}
          className="cursor-pointer focus:outline-none group rounded-full p-0.5 hover:ring-2 hover:ring-[#C5A059]/40 transition-all"
        >
          <img
            src={userProfile.avatar}
            alt="Advait"
            className="w-9 h-9 rounded-full object-cover border border-[#E5E0D5]"
          />
        </button>
      </div>
    </header>
  );
};
