import React from 'react';
import { ShieldCheck, Mail, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TravelPreferences } from './TravelPreferences';
import { AIPreferences } from './AIPreferences';
import { PaymentPreferences } from './PaymentPreferences';

export const ProfileView: React.FC = () => {
  const { userProfile } = useApp();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Profile Header Hero */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img 
              src={userProfile.avatar} 
              alt={userProfile.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-voyage-border shadow-soft-md" 
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-voyage-dark text-voyage-gold border-2 border-white shadow-soft-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-voyage-dark">
                {userProfile.name}
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-voyage-gold-dark border border-voyage-gold/30">
                VIP Member
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-voyage-muted">
              <Mail className="w-3.5 h-3.5" />
              <span>{userProfile.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified Identity & Vault</span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right bg-voyage-bg p-4 rounded-2xl border border-voyage-border self-start sm:self-auto">
          <span className="text-[10px] font-semibold text-voyage-muted uppercase tracking-wider block">Autonomous Spend Limit</span>
          <span className="font-serif-luxury text-2xl font-bold text-voyage-dark">₹1,50,000</span>
          <span className="text-[11px] text-voyage-muted block">Requires approval above this threshold</span>
        </div>
      </div>

      {/* Travel Preferences */}
      <TravelPreferences />

      {/* AI Preferences */}
      <AIPreferences />

      {/* Payment Preferences */}
      <PaymentPreferences />
    </div>
  );
};
