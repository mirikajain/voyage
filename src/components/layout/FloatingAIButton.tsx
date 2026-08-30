import React from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FloatingAIButton: React.FC = () => {
  const { setCurrentPage, currentPage } = useApp();

  if (currentPage === 'concierge') return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={() => setCurrentPage('concierge')}
        className="group flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-voyage-dark hover:bg-slate-900 text-white shadow-soft-lg hover:shadow-gold-glow border border-voyage-gold/40 transition-all duration-300 transform hover:-translate-y-1"
        aria-label="Ask Voyage AI Concierge"
      >
        <div className="p-1 rounded-full bg-voyage-gold text-voyage-dark">
          <Sparkles className="w-4 h-4 fill-voyage-dark" />
        </div>
        <span className="font-semibold text-sm tracking-wide">Ask Voyage ✦</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>
    </div>
  );
};
