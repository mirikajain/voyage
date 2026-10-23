import React from 'react';
import { BudgetOverviewCard } from './BudgetOverviewCard';
import { SpendingChart } from './SpendingChart';
import { AIMoneyInsights } from './AIMoneyInsights';
import { OptimizeModal } from './OptimizeModal';
import { RazorpayVaultBadge, TransactionLedger } from './RazorpayVaultBadge';

export const WalletView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-voyage-gold-dark">
            Financial Layer
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-voyage-dark">
          Travel Wallet & Budget
        </h1>
        <p className="text-xs sm:text-sm text-voyage-muted mt-1">
          Real-time expense telemetry, proactive AI guardrails, and Razorpay-powered execution.
        </p>
      </div>

      {/* Top Card: Paris Trip Budget */}
      <BudgetOverviewCard />

      {/* Spending Breakdown Chart */}
      <SpendingChart />

      {/* AI Money Insights */}
      <AIMoneyInsights />

      {/* Transactions & Security */}
      <TransactionLedger />
      <RazorpayVaultBadge />

      {/* Optimization Modal */}
      <OptimizeModal />
    </div>
  );
};
