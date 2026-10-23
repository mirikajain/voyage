import React from 'react';
import { 
  Home, 
  Luggage, 
  Compass, 
  Wallet, 
  Sparkles, 
  Bell 
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
    { id: 'concierge', label: 'AI Concierge', icon: Sparkles },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <aside className="w-56 lg:w-60 flex-shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4 select-none">
      {/* Navigation Links */}
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = 
            currentPage === item.id || 
            (item.id === 'trips' && currentPage === 'trip-detail');

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-[#ECEAE4] text-[#121826] font-semibold'
                  : 'text-[#555E68] hover:bg-black/[0.03] hover:text-[#121826] font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#121826]' : 'text-[#6B7280]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile */}
      <div 
        onClick={() => setCurrentPage('profile')}
        className="flex items-center gap-3 pt-6 px-2 cursor-pointer group"
      >
        <img
          src={userProfile.avatar}
          alt={userProfile.name}
          className="w-10 h-10 rounded-full object-cover border border-[#E5E0D5] group-hover:ring-2 group-hover:ring-[#C5A059]/40 transition-all"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#121826] truncate leading-tight">Advait</p>
          <p className="text-xs text-[#8C939E] font-medium leading-tight mt-0.5">Premium Member</p>
        </div>
      </div>
    </aside>
  );
};
