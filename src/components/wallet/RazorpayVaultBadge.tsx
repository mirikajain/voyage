import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { mockTransactions } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export const RazorpayVaultBadge: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-voyage-border/80 shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-voyage-dark text-voyage-gold flex items-center justify-center flex-shrink-0 shadow-soft-sm font-serif-luxury font-bold">
          ₹
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-voyage-dark">Powered by Razorpay Smart Financial Layer</h4>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">PCI-DSS L1</span>
          </div>
          <p className="text-xs text-voyage-muted mt-0.5">
            Real-time multi-currency vaulting, auto-categorized expense ledgers, and dynamic spend authorizations.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-voyage-muted self-end sm:self-auto">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero Forex Surcharge</span>
        </div>
      </div>
    </div>
  );
};

export const TransactionLedger: React.FC = () => {
  const { userProfile } = useApp();
  const txList = userProfile.transactions && userProfile.transactions.length > 0
    ? userProfile.transactions
    : mockTransactions;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark">
            Recent Travel Transactions
          </h3>
          <p className="text-xs text-voyage-muted">Autonomous ledger logged via Razorpay Checkout</p>
        </div>
        <span className="text-xs font-semibold text-emerald-700">All Settled</span>
      </div>

      <div className="divide-y divide-voyage-border/60">
        {txList.map((tx) => (
          <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h5 className="text-xs sm:text-sm font-semibold text-voyage-dark">{tx.title}</h5>
              <div className="flex items-center gap-2 text-[11px] text-voyage-muted">
                <span>{tx.category}</span>
                <span>•</span>
                <span>{tx.date}</span>
                <span>•</span>
                <span className="font-mono text-[10px] text-slate-500">{tx.razorpayPaymentId}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs sm:text-sm font-bold text-voyage-dark">
                {tx.currency} {tx.amount.toLocaleString()}
              </span>
              <p className="text-[10px] text-emerald-700 font-medium">{tx.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
