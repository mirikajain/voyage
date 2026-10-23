import React from 'react';
import { Sparkles, TrendingUp, Clock, Tag, ArrowRight } from 'lucide-react';
import { mockInsights } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export const VoyageInsights: React.FC = () => {
  const { triggerAIPromptFromAnywhere, setIsRazorpayCheckoutOpen, setActiveCheckoutItem } = useApp();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'budget':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'logistics':
        return <Clock className="w-4 h-4 text-voyage-blue-accent" />;
      case 'savings':
        return <Tag className="w-4 h-4 text-voyage-gold-dark" />;
      default:
        return <Sparkles className="w-4 h-4 text-voyage-gold" />;
    }
  };

  const handleInsightAction = (insight: typeof mockInsights[0]) => {
    if (insight.type === 'savings') {
      setActiveCheckoutItem({
        title: 'Executive EV Airport Transfer (Save ₹1,200)',
        amount: 1800,
        currency: 'INR',
        description: 'Auto-reserved EV sedan transfer • Flight tracked',
        category: 'Transport',
      });
      setIsRazorpayCheckoutOpen(true);
    } else if (insight.type === 'logistics') {
      triggerAIPromptFromAnywhere('Show me check-in details and early access confirmation for Ahilya by the Sea');
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-voyage-gold" />
          <h3 className="font-serif-luxury text-xl font-bold text-voyage-dark">
            Voyage Insights
          </h3>
        </div>
        <span className="text-xs text-voyage-muted font-medium">Proactive Autonomous Intelligence</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockInsights.map((insight) => (
          <div
            key={insight.id}
            className="bg-white rounded-2xl p-5 border border-voyage-border/80 shadow-soft-xs hover:shadow-soft-sm hover:border-voyage-gold/30 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-voyage-bg border border-voyage-border/50">
                  {getInsightIcon(insight.type)}
                </div>
                {insight.badgeText && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-voyage-bg text-voyage-slate border border-voyage-border/50">
                    {insight.badgeText}
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-sm text-voyage-dark leading-snug mb-1.5">
                "{insight.headline}"
              </h4>
              <p className="text-xs text-voyage-muted line-clamp-2 leading-relaxed">
                {insight.subtext}
              </p>
            </div>

            {insight.isActionable && insight.actionLabel && (
              <div className="mt-4 pt-3 border-t border-voyage-border/50">
                <button
                  onClick={() => handleInsightAction(insight)}
                  className="w-full py-2 px-3 rounded-xl bg-voyage-bg hover:bg-amber-50/50 hover:border-voyage-gold/50 border border-voyage-border/60 text-xs font-semibold text-voyage-dark flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>{insight.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-voyage-gold-dark" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
