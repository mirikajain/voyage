import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, X, Lock, CreditCard, Smartphone, Building, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

export const RazorpayCheckoutModal: React.FC = () => {
  const { isRazorpayCheckoutOpen, setIsRazorpayCheckoutOpen, activeCheckoutItem, userProfile } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isRazorpayCheckoutOpen || !activeCheckoutItem) return null;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Fire luxury confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C5A059', '#111827', '#10B981', '#E2DDD5'],
      });
    }, 1500);
  };

  const handleClose = () => {
    setIsRazorpayCheckoutOpen(false);
    setIsSuccess(false);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-voyage-dark/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-luxury border border-voyage-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Razorpay Header Bar */}
        <div className="bg-voyage-dark text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-voyage-blue-accent flex items-center justify-center text-white font-bold text-xs">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-wide">Razorpay</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Secure</span>
              </div>
              <p className="text-[10px] text-slate-400">Merchant: Voyage Luxury AI Vault</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/60">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark">Payment Authorized</h3>
              <p className="text-xs text-voyage-muted mt-1">Transaction ID: <span className="font-mono text-voyage-dark font-medium">pay_RZP_{Date.now().toString().slice(-8)}</span></p>
            </div>

            <div className="bg-voyage-bg rounded-2xl p-4 text-left text-xs space-y-2 border border-voyage-border">
              <div className="flex justify-between">
                <span className="text-voyage-muted">Item:</span>
                <span className="font-semibold text-voyage-dark">{activeCheckoutItem.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-voyage-muted">Amount Paid:</span>
                <span className="font-bold text-voyage-dark">₹{activeCheckoutItem.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-voyage-muted">Wallet Impact:</span>
                <span className="text-emerald-700 font-semibold">Logged into Paris Ledger</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-voyage-muted">
              <Sparkles className="w-3.5 h-3.5 text-voyage-gold" />
              <span>Itinerary automatically updated with reservation ticket</span>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold shadow-soft-sm transition-all"
            >
              Back to Voyage Workspace
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Amount Summary */}
            <div className="p-4 rounded-2xl bg-voyage-bg/70 border border-voyage-border/80">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h4 className="font-semibold text-sm text-voyage-dark">{activeCheckoutItem.title}</h4>
                  <p className="text-xs text-voyage-muted line-clamp-1">{activeCheckoutItem.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-voyage-dark">₹{activeCheckoutItem.amount.toLocaleString()}</span>
                  <p className="text-[10px] text-voyage-muted">incl. all taxes</p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-voyage-border/60 flex items-center justify-between text-[11px]">
                <span className="text-voyage-slate">AI Guardrail Check:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Approved under budget
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">Select Payment Method</p>
              
              {/* Saved Card (Razorpay Vault) */}
              <label 
                onClick={() => setSelectedMethod('card')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'card' 
                    ? 'border-voyage-dark bg-amber-50/20 shadow-soft-xs' 
                    : 'border-voyage-border hover:bg-voyage-bg'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voyage-dark text-voyage-gold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-voyage-dark">
                      {userProfile.paymentPreferences.savedCards[0].brand} •••• {userProfile.paymentPreferences.savedCards[0].last4}
                    </p>
                    <p className="text-[10px] text-voyage-muted">Saved in Razorpay Vault • Exp {userProfile.paymentPreferences.savedCards[0].expiry}</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={selectedMethod === 'card'} 
                  onChange={() => setSelectedMethod('card')}
                  className="accent-voyage-dark" 
                />
              </label>

              {/* UPI */}
              <label 
                onClick={() => setSelectedMethod('upi')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'upi' 
                    ? 'border-voyage-dark bg-amber-50/20 shadow-soft-xs' 
                    : 'border-voyage-border hover:bg-voyage-bg'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-voyage-blue-light text-voyage-blue-accent">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-voyage-dark">{userProfile.paymentPreferences.savedUpi[0].upiId}</p>
                    <p className="text-[10px] text-voyage-muted">{userProfile.paymentPreferences.savedUpi[0].provider}</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={selectedMethod === 'upi'} 
                  onChange={() => setSelectedMethod('upi')}
                  className="accent-voyage-dark" 
                />
              </label>

              {/* NetBanking */}
              <label 
                onClick={() => setSelectedMethod('netbanking')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMethod === 'netbanking' 
                    ? 'border-voyage-dark bg-amber-50/20 shadow-soft-xs' 
                    : 'border-voyage-border hover:bg-voyage-bg'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 text-voyage-slate">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-voyage-dark">HDFC Bank VIP NetBanking</p>
                    <p className="text-[10px] text-voyage-muted">Direct high-limit settlement</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={selectedMethod === 'netbanking'} 
                  onChange={() => setSelectedMethod('netbanking')}
                  className="accent-voyage-dark" 
                />
              </label>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white font-semibold text-sm shadow-soft-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authorizing via Razorpay...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-voyage-gold" />
                  <span>Authorize & Pay ₹{activeCheckoutItem.amount.toLocaleString()}</span>
                </>
              )}
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-voyage-muted text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PCI-DSS Level 1 Encrypted • 100% Instant Refund Protection</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
