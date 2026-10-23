import React, { useState } from 'react';
import { 
  Sparkles, 
  Bell, 
  Menu, 
  X,
  Home,
  Luggage,
  Compass,
  Wallet 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavigationPage } from '../../types';

export const TopNavbar: React.FC = () => {
  const { currentPage, setCurrentPage, userProfile, triggerAIPromptFromAnywhere } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: NavigationPage; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'trips', label: 'Trips', icon: Luggage },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
  ];

  const handleNavClick = (id: NavigationPage) => {
    setCurrentPage(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFEFC]/95 backdrop-blur-md border-b border-voyage-border/80 shadow-soft-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Main Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-voyage-dark flex items-center justify-center text-white shadow-soft-xs group-hover:scale-105 transition-transform duration-300">
              <span className="text-base font-serif-luxury font-bold tracking-widest text-voyage-gold">V</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-luxury text-xl font-bold tracking-wider text-voyage-dark">VOYAGE</span>
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-voyage-gold/15 text-voyage-gold-dark font-semibold">AI</span>
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="hidden md:block h-4 w-px bg-voyage-border/90" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-3 py-1.5 text-xs font-semibold tracking-wide transition-all rounded-lg ${
                    isActive
                      ? 'text-voyage-dark'
                      : 'text-voyage-muted hover:text-voyage-dark hover:bg-black/[0.03]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-voyage-dark rounded-full" />
                  )}
                </button>
              );
            })}

            {/* AI Concierge Core Differentiator - Distinct Highlight */}
            <button
              onClick={() => handleNavClick('concierge')}
              className={`ml-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-soft-xs ${
                currentPage === 'concierge'
                  ? 'bg-voyage-dark text-white border border-voyage-gold/60 shadow-gold-glow'
                  : 'bg-voyage-gold/15 hover:bg-voyage-gold/25 text-voyage-gold-dark border border-voyage-gold/30 hover:border-voyage-gold/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-voyage-gold" />
              <span>AI Concierge</span>
              <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold animate-pulse" />
            </button>
          </nav>
        </div>

        {/* Right: Notifications & Profile Avatar */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-black/[0.04] text-voyage-slate hover:text-voyage-dark transition-all relative"
              title="Autonomous alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-voyage-gold ring-2 ring-[#FFFEFC]" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#FFFEFC] rounded-2xl border border-voyage-border shadow-soft-lg p-3.5 z-50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-voyage-border/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-voyage-dark">
                    Autonomous Alerts
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-voyage-gold-dark font-semibold border border-voyage-gold/30">
                    2 unread
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div 
                    onClick={() => {
                      setShowNotifications(false);
                      triggerAIPromptFromAnywhere('Show check-in details for Ahilya by the Sea');
                    }}
                    className="p-2 rounded-xl hover:bg-voyage-bg cursor-pointer transition-colors"
                  >
                    <p className="font-semibold text-voyage-dark">Hotel check-in confirmed</p>
                    <p className="text-voyage-muted text-[11px]">Ahilya by the Sea bag drop starting 11:30 AM</p>
                  </div>
                  <div 
                    onClick={() => {
                      setShowNotifications(false);
                      triggerAIPromptFromAnywhere('Review ₹1,200 savings on airport transfer');
                    }}
                    className="p-2 rounded-xl hover:bg-voyage-bg cursor-pointer transition-colors"
                  >
                    <p className="font-semibold text-emerald-800">Smart saving discovered</p>
                    <p className="text-voyage-muted text-[11px]">₹1,200 cheaper EV transfer ready to reserve</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <button
            type="button"
            onClick={() => handleNavClick('profile')}
            className={`flex items-center gap-2 p-1 pr-2.5 rounded-full border transition-all ${
              currentPage === 'profile'
                ? 'border-voyage-dark bg-black/[0.04]'
                : 'border-voyage-border/80 hover:border-voyage-gold/50 bg-[#FFFEFC] shadow-soft-xs hover:shadow-soft-sm'
            }`}
            title="Account & Travel Preferences"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-7 h-7 rounded-full object-cover border border-voyage-border"
            />
            <span className="hidden sm:inline text-xs font-semibold text-voyage-dark">
              {userProfile.name.split(' ')[0]}
            </span>
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-voyage-dark hover:bg-black/[0.04]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-3 bg-[#FFFEFC] border-t border-voyage-border/80 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'bg-voyage-dark text-white'
                    : 'text-voyage-slate hover:bg-voyage-bg'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-voyage-gold' : 'text-voyage-muted'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />}
              </button>
            );
          })}

          <button
            onClick={() => handleNavClick('concierge')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold border ${
              currentPage === 'concierge'
                ? 'bg-voyage-dark text-white border-voyage-gold/50'
                : 'bg-voyage-gold/15 text-voyage-gold-dark border-voyage-gold/30'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-voyage-gold" />
              <span>AI Concierge</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-voyage-gold/20">Core</span>
          </button>
        </div>
      )}
    </header>
  );
};
