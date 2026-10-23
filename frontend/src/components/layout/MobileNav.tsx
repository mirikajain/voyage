import React from 'react';
import { Home, Luggage, Compass, Wallet, Sparkles, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavigationPage } from '../../types';

export const MobileNav: React.FC = () => {
  const { currentPage, setCurrentPage, setIsGlobalAIModalOpen } = useApp();

  const navItems: { id: NavigationPage; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'trips', label: 'Trips', icon: Luggage },
    { id: 'concierge', label: 'AI Concierge', icon: Sparkles },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-voyage-border/80 px-4 py-3.5 flex items-center justify-between">
        <div 
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-voyage-dark flex items-center justify-center text-white">
            <span className="font-serif-luxury font-bold text-voyage-gold text-sm">V</span>
          </div>
          <span className="font-serif-luxury text-xl font-bold tracking-wider text-voyage-dark">VOYAGE</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGlobalAIModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-voyage-dark text-white text-xs font-semibold shadow-soft-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-voyage-gold" />
            <span>Ask Voyage</span>
          </button>
          <button
            onClick={() => setCurrentPage('profile')}
            aria-label="Profile"
            className="p-1.5 rounded-full bg-voyage-bg border border-voyage-border text-voyage-dark"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-voyage-border px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const isConcierge = item.id === 'concierge';

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isConcierge
                  ? isActive
                    ? 'text-voyage-gold-dark font-bold'
                    : 'text-voyage-gold font-semibold'
                  : isActive
                  ? 'text-voyage-dark font-semibold'
                  : 'text-voyage-muted font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isConcierge ? 'bg-voyage-dark text-voyage-gold shadow-soft-xs' : isActive ? 'bg-voyage-bg' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
