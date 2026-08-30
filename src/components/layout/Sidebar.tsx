import React from 'react';
import { 
  Home, 
  Luggage, 
  Compass, 
  Wallet, 
  Sparkles, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavigationPage } from '../../types';

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, userProfile } = useApp();

  const navItems: { id: NavigationPage; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'trips', label: 'Trips', icon: Luggage },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/95 border-r border-voyage-border/80 h-screen sticky top-0 px-5 py-6 justify-between select-none z-30 shadow-soft-xs backdrop-blur-md">
      {/* Top Brand */}
      <div>
        <div 
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-3 cursor-pointer group mb-9 px-2"
        >
          <div className="w-10 h-10 rounded-xl bg-voyage-dark flex items-center justify-center text-white shadow-soft-md group-hover:scale-105 transition-transform duration-300">
            <span className="text-lg font-serif-luxury font-bold tracking-widest text-voyage-gold">V</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-luxury text-2xl font-bold tracking-wider text-voyage-dark">VOYAGE</span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-voyage-gold/15 text-voyage-gold-dark font-semibold">AI</span>
            </div>
            <p className="text-[11px] text-voyage-muted tracking-tight">Travel & Financial Concierge</p>
          </div>
        </div>

        {/* Main Nav items */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-voyage-muted/80 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-voyage-dark text-white shadow-soft-sm'
                    : 'text-voyage-slate hover:bg-voyage-bg hover:text-voyage-dark'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-voyage-gold' : 'text-voyage-muted'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Core Intelligence & Profile Layer */}
      <div className="space-y-3 pt-4 border-t border-voyage-border/60">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-voyage-muted/80">
          Core Intelligence
        </p>

        {/* AI Concierge Highlighted Button */}
        <button
          onClick={() => setCurrentPage('concierge')}
          className={`w-full relative overflow-hidden group p-3.5 rounded-2xl border transition-all duration-300 text-left ${
            currentPage === 'concierge'
              ? 'bg-gradient-to-br from-voyage-dark via-slate-900 to-voyage-blue text-white border-voyage-gold/50 shadow-gold-glow'
              : 'bg-gradient-to-br from-voyage-gold/10 via-amber-50/40 to-white hover:from-voyage-gold/20 text-voyage-dark border-voyage-gold/30 shadow-soft-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${currentPage === 'concierge' ? 'bg-voyage-gold text-voyage-dark' : 'bg-voyage-dark text-voyage-gold'}`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">AI Concierge</span>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-voyage-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-voyage-gold"></span>
            </span>
          </div>
          <p className={`text-xs ${currentPage === 'concierge' ? 'text-slate-300' : 'text-voyage-muted'} line-clamp-1`}>
            Autonomous planning & spend control
          </p>
        </button>

        {/* Profile Card Button */}
        <button
          onClick={() => setCurrentPage('profile')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
            currentPage === 'profile'
              ? 'bg-voyage-bg border-voyage-dark/20 text-voyage-dark'
              : 'bg-transparent border-transparent hover:bg-voyage-bg/70 text-voyage-slate'
          }`}
        >
          <div className="flex items-center gap-3">
            <img 
              src={userProfile.avatar} 
              alt={userProfile.name} 
              className="w-9 h-9 rounded-full object-cover border border-voyage-border"
            />
            <div className="text-left">
              <p className="text-xs font-semibold text-voyage-dark leading-tight">{userProfile.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] text-voyage-muted font-medium">Razorpay Vaulted</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-voyage-muted" />
        </button>
      </div>
    </aside>
  );
};
