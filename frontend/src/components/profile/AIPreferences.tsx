import React from 'react';
import { Sparkles, Shield, AlertCircle, CalendarCheck, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AIPreferences: React.FC = () => {
  const { userProfile, updateAIPreference } = useApp();

  const toggles: {
    key: keyof typeof userProfile.aiPreferences;
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      key: 'askBeforePurchases',
      title: 'Ask before making purchases',
      description: 'Requires explicit one-click authorization before initiating any Razorpay payment or booking.',
      icon: Shield,
    },
    {
      key: 'alertBudgetRisks',
      title: 'Alert me about budget risks',
      description: 'Proactively flags anomalies, price surges, and category envelope overruns in real-time.',
      icon: AlertCircle,
    },
    {
      key: 'suggestItineraryChanges',
      title: 'Suggest itinerary changes',
      description: 'Allows Voyage to recommend smarter chronological routes, weather updates, and transfer savings.',
      icon: CalendarCheck,
    },
    {
      key: 'autoOptimizeRecommendations',
      title: 'Automatically optimize recommendations',
      description: 'Dynamically rebalances savings from transport into fine dining or room upgrades.',
      icon: Zap,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-sm space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-voyage-dark text-voyage-gold">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-serif-luxury text-2xl font-bold text-voyage-dark">
            AI Agent Governance & Autonomy
          </h3>
          <p className="text-xs text-voyage-muted">Control safety guardrails, spending limits, and proactive triggers</p>
        </div>
      </div>

      <div className="space-y-4">
        {toggles.map((item) => {
          const Icon = item.icon;
          const isEnabled = userProfile.aiPreferences[item.key];

          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-voyage-bg border border-voyage-border/80 hover:border-voyage-gold/30 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-white text-voyage-slate border border-voyage-border mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-voyage-dark">{item.title}</h4>
                  <p className="text-xs text-voyage-muted mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </div>

              {/* Interactive Toggle Switch */}
              <button
                type="button"
                onClick={() => updateAIPreference(item.key, !isEnabled)}
                aria-pressed={isEnabled}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-voyage-dark' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
