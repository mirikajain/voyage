import React from 'react';
import { X, Sparkles, CheckCircle2, Star, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ItemEvaluationModal: React.FC = () => {
  const { activeEvaluationItem, setActiveEvaluationItem, triggerAIPromptFromAnywhere, setIsRazorpayCheckoutOpen, setActiveCheckoutItem } = useApp();

  if (!activeEvaluationItem) return null;

  const handleBook = () => {
    setActiveCheckoutItem({
      title: activeEvaluationItem.name,
      amount: activeEvaluationItem.price,
      currency: activeEvaluationItem.currency,
      description: `Direct reservation • ${activeEvaluationItem.location}`,
      category: activeEvaluationItem.category,
    });
    setActiveEvaluationItem(null);
    setIsRazorpayCheckoutOpen(true);
  };

  const handleAskQuestions = () => {
    const item = activeEvaluationItem;
    setActiveEvaluationItem(null);
    triggerAIPromptFromAnywhere(`Can you tell me more about ${item.name} in ${item.location} and how it fits my travel style?`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-voyage-dark/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-luxury border border-voyage-border overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Visual */}
        <div className="relative h-48 sm:h-56 w-full flex-shrink-0">
          <img 
            src={activeEvaluationItem.image} 
            alt={activeEvaluationItem.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-voyage-dark via-voyage-dark/30 to-black/30" />

          {/* Close Button */}
          <button
            onClick={() => setActiveEvaluationItem(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Match */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-voyage-gold text-voyage-dark">
                  {activeEvaluationItem.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-300 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {activeEvaluationItem.rating} ({activeEvaluationItem.reviewCount} reviews)
                </span>
              </div>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-wide">
                {activeEvaluationItem.name}
              </h3>
              <p className="text-xs text-slate-200">{activeEvaluationItem.location}</p>
            </div>
            
            <div className="text-right bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">AI Match</span>
              <span className="text-lg font-bold text-voyage-gold">{activeEvaluationItem.matchScore}%</span>
            </div>
          </div>
        </div>

        {/* Evaluation Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Agent Analysis Box */}
          <div className="p-5 rounded-2xl bg-voyage-bg border border-voyage-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-voyage-dark text-voyage-gold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm text-voyage-dark">
                Voyage Autonomous Evaluation
              </h4>
            </div>

            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">
                Why Voyage Recommends This:
              </p>
              <ul className="space-y-2">
                {activeEvaluationItem.aiEvaluation.whyRecommended.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-voyage-slate leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Itinerary & Budget fit badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-voyage-border/60 text-xs">
              <div className="p-3 rounded-xl bg-white border border-voyage-border/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-voyage-muted block">Itinerary Alignment</span>
                <p className="font-medium text-voyage-dark">{activeEvaluationItem.aiEvaluation.itineraryFit}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-voyage-border/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-voyage-muted block">Budget Impact</span>
                <p className="font-medium text-emerald-700">{activeEvaluationItem.aiEvaluation.budgetImpact}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleAskQuestions}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-voyage-border hover:bg-voyage-bg text-xs font-semibold text-voyage-dark flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-voyage-gold-dark" />
              <span>Ask Agent Follow-up</span>
            </button>
            <button
              onClick={handleBook}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-voyage-dark hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-soft-sm transition-all"
            >
              <span>Book Now • {activeEvaluationItem.currency}{activeEvaluationItem.price.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4 text-voyage-gold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
