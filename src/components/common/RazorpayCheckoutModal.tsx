import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, X, Lock, CreditCard, Smartphone, Building, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { verifyPaymentSignature } from '../../services/agentApi';

export const RazorpayCheckoutModal: React.FC = () => {
  const { 
    isRazorpayCheckoutOpen, 
    setIsRazorpayCheckoutOpen, 
    activeCheckoutItem, 
    activeRecommendationResult,
    currentThreadId,
    userProfile,
    handleConfirmPaymentSuccess,
    setCurrentPage
  } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<'checkout' | 'success' | 'failed'>('checkout');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [confirmedPaymentData, setConfirmedPaymentData] = useState<{
    paymentId: string;
    orderId: string;
    bookingRef: string;
  } | null>(null);

  if (!isRazorpayCheckoutOpen || !activeCheckoutItem) return null;

  const amountInRupees = activeCheckoutItem.amount;
  const amountInPaise = Math.round(amountInRupees * 100);
  const paymentRef = activeRecommendationResult?.paymentReference || `VOYAGE-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  const orderId = activeRecommendationResult?.paymentOrder?.order_id || `order_${Date.now().toString().slice(-8)}`;
  const isDemoMode = !activeRecommendationResult?.paymentOrder?.mode || activeRecommendationResult?.paymentOrder?.mode === 'demo';

  const handlePay = async () => {
    setIsProcessing(true);

    try {
      if (simulateFailure) {
        setTimeout(() => {
          setIsProcessing(false);
          setPaymentState('failed');
        }, 1000);
        return;
      }

      const generatedPaymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const signature = `demo_sig_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      // 1. Call server-side payment verification endpoint
      const verifyRes = await verifyPaymentSignature({
        razorpay_order_id: orderId,
        razorpay_payment_id: generatedPaymentId,
        razorpay_signature: signature,
        thread_id: currentThreadId || undefined,
        amount: amountInRupees,
        currency: 'INR'
      });

      const bookingRef = verifyRes.booking_reference || `${paymentRef}-BK`;

      setConfirmedPaymentData({
        paymentId: generatedPaymentId,
        orderId,
        bookingRef,
      });

      // 2. Call context payment success handler to update state and trips
      if (handleConfirmPaymentSuccess) {
        await handleConfirmPaymentSuccess({
          order_id: orderId,
          payment_id: generatedPaymentId,
          payment_reference: paymentRef,
          amount: amountInRupees,
          currency: 'INR',
          status: 'paid',
        });
      }

      setIsProcessing(false);
      setPaymentState('success');

      // Luxury celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C5A059', '#111827', '#10B981', '#E2DDD5'],
        });
      } catch {
        // no-op
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setIsProcessing(false);
      setPaymentState('failed');
    }
  };

  const handleClose = () => {
    setIsRazorpayCheckoutOpen(false);
    setPaymentState('checkout');
    setIsProcessing(false);
    setSimulateFailure(false);
  };

  const handleViewBookedTrip = () => {
    handleClose();
    setCurrentPage('trips');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-voyage-dark/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-luxury border border-voyage-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Razorpay Header Bar */}
        <div className="bg-voyage-dark text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-wide">Razorpay</span>
                {isDemoMode ? (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Demo Payment
                  </span>
                ) : (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Test Mode
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Voyage Luxury Travel AI Concierge</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State 1: Payment Success */}
        {paymentState === 'success' && (
          <div className="p-7 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/70">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                Payment Successful
              </span>
              <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark mt-2">
                Booking Confirmed
              </h3>
              <p className="text-xs text-voyage-muted mt-1">
                Your reservation is confirmed and synced to your Voyage Wallet.
              </p>
            </div>

            {/* Receipt Details Box */}
            <div className="bg-voyage-bg rounded-2xl p-4 text-left text-xs space-y-2 border border-voyage-border/80">
              <div className="flex justify-between">
                <span className="text-voyage-muted">Trip Package:</span>
                <span className="font-semibold text-voyage-dark">{activeCheckoutItem.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-voyage-muted">Amount Paid:</span>
                <span className="font-bold text-voyage-dark">₹{amountInRupees.toLocaleString()} ({amountInPaise.toLocaleString()} paise)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-voyage-muted">Payment ID:</span>
                <span className="font-mono text-[11px] text-voyage-dark font-medium">{confirmedPaymentData?.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-voyage-muted">Order ID:</span>
                <span className="font-mono text-[11px] text-voyage-dark">{confirmedPaymentData?.orderId}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-voyage-border/60">
                <span className="text-voyage-muted">Booking Reference:</span>
                <span className="font-mono font-bold text-voyage-gold-dark">{confirmedPaymentData?.bookingRef}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-voyage-muted">
              <Sparkles className="w-3.5 h-3.5 text-voyage-gold" />
              <span>Trip status updated to <strong>BOOKED</strong> in My Trips</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={handleViewBookedTrip}
                className="w-full py-3 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold shadow-soft-sm transition-all"
              >
                View in My Trips
              </button>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl border border-voyage-border hover:bg-voyage-bg text-xs font-semibold text-voyage-slate hover:text-voyage-dark transition-colors"
              >
                Return to Concierge
              </button>
            </div>
          </div>
        )}

        {/* State 2: Payment Failure */}
        {paymentState === 'failed' && (
          <div className="p-7 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/70">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-700 bg-rose-100/60 px-2.5 py-0.5 rounded-full">
                Transaction Declined
              </span>
              <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark mt-2">
                Payment couldn't be completed
              </h3>
              <p className="text-xs text-voyage-muted mt-1">
                Your bank or payment provider declined authorization. No funds were debited and your trip remains saved.
              </p>
            </div>

            <div className="bg-rose-50/40 rounded-2xl p-4 text-left text-xs border border-rose-200/60 space-y-1.5">
              <p className="font-semibold text-rose-900">Failure Diagnostics (Simulated):</p>
              <p className="text-rose-700 text-[11px]">• Bank timeout or user cancellation</p>
              <p className="text-rose-700 text-[11px]">• Status: <span className="font-mono font-bold">payment_status = failed</span></p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  setSimulateFailure(false);
                  setPaymentState('checkout');
                }}
                className="w-full py-3 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-soft-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl border border-voyage-border hover:bg-voyage-bg text-xs font-semibold text-voyage-slate hover:text-voyage-dark transition-colors"
              >
                Return to trip
              </button>
            </div>
          </div>
        )}

        {/* State 3: Normal Checkout Form */}
        {paymentState === 'checkout' && (
          <div className="p-6 space-y-4">
            {/* Amount Summary */}
            <div className="p-4 rounded-2xl bg-voyage-bg/80 border border-voyage-border/80">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-voyage-muted">Payable to Voyage</span>
                  <h4 className="font-bold text-sm text-voyage-dark">{activeCheckoutItem.title}</h4>
                  <p className="text-xs text-voyage-muted line-clamp-1">{activeCheckoutItem.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-serif-luxury text-voyage-dark">
                    ₹{amountInRupees.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-voyage-muted">{amountInPaise.toLocaleString()} paise</p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-voyage-border/60 flex items-center justify-between text-[11px]">
                <span className="text-voyage-slate font-medium">Ref: <span className="font-mono">{paymentRef}</span></span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Spend Guardrail Approved
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">Select Payment Method</p>
              
              {/* Saved Card */}
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
                      {userProfile.paymentPreferences?.savedCards?.[0]?.brand || 'HDFC Bank'} •••• {userProfile.paymentPreferences?.savedCards?.[0]?.last4 || '4242'}
                    </p>
                    <p className="text-[10px] text-voyage-muted">Razorpay Token Vault • Exp {userProfile.paymentPreferences?.savedCards?.[0]?.expiry || '12/28'}</p>
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
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-voyage-dark">{userProfile.paymentPreferences?.savedUpi?.[0]?.upiId || 'advait@okhdfcbank'}</p>
                    <p className="text-[10px] text-voyage-muted">Instant UPI (GPay / PhonePe / Paytm)</p>
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
                    <p className="text-[10px] text-voyage-muted">Instant direct settlement</p>
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

            {/* Test Toggle: Simulate Failure */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-voyage-slate">Demo Test: Simulate Payment Failure</span>
              <button
                type="button"
                onClick={() => setSimulateFailure(prev => !prev)}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                  simulateFailure ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {simulateFailure ? 'Failure Simulation ON' : 'Failure Simulation OFF'}
              </button>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white font-semibold text-sm shadow-soft-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing via Razorpay...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-voyage-gold" />
                  <span>Pay ₹{amountInRupees.toLocaleString()}</span>
                </>
              )}
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-voyage-muted text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay 256-Bit Bank Grade Encryption • 100% Secure Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
