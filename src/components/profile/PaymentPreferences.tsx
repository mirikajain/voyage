import React from 'react';
import { CreditCard, Smartphone, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PaymentPreferences: React.FC = () => {
  const { userProfile } = useApp();

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-voyage-bg border border-voyage-border text-voyage-dark">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark">
              Payment & Razorpay Vault
            </h3>
            <p className="text-xs text-voyage-muted">Tokenized payment instruments for instant travel execution</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>Razorpay Token Vault Active</span>
        </div>
      </div>

      {/* Preferred Method Banner */}
      <div className="p-4 rounded-2xl bg-voyage-bg border border-voyage-border flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-voyage-muted tracking-wider">Default Payment Method</span>
          <p className="text-sm font-bold text-voyage-dark mt-0.5">{userProfile.paymentPreferences.preferredMethod}</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-800">
          Auto-Selected
        </span>
      </div>

      {/* Saved Cards */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">
          Saved Cards (Tokenized via Razorpay)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {userProfile.paymentPreferences.savedCards.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-2xl bg-gradient-to-br from-voyage-dark via-slate-900 to-slate-800 text-white shadow-soft-sm space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs tracking-wider text-voyage-gold">{card.brand}</span>
                {card.isDefault && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Primary
                  </span>
                )}
              </div>
              <div className="font-mono text-sm tracking-widest text-slate-200">
                •••• •••• •••• {card.last4}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
                <span>{card.holderName}</span>
                <span>EXP {card.expiry}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved UPI */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">
          Connected UPI Handles
        </p>
        <div className="space-y-2">
          {userProfile.paymentPreferences.savedUpi.map((upi) => (
            <div
              key={upi.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-voyage-bg border border-voyage-border/80"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-voyage-blue-light text-voyage-blue-accent">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-voyage-dark">{upi.upiId}</p>
                  <p className="text-[10px] text-voyage-muted">{upi.provider}</p>
                </div>
              </div>
              {upi.isDefault && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
