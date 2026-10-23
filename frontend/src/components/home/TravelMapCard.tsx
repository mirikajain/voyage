import React, { useState } from 'react';
import { Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MapNode {
  id: string;
  name: string;
  country: string;
  role: string;
  status: 'origin' | 'active' | 'pinned' | 'hub' | 'curated';
  x: number;
  y: number;
  prompt: string;
}

export const TravelMapCard: React.FC = () => {
  const { triggerAIPromptFromAnywhere, setCurrentPage } = useApp();
  const [hoveredNode, setHoveredNode] = useState<string | null>('goa');

  const nodes: MapNode[] = [
    { id: 'delhi', name: 'Delhi', country: 'India', role: 'Home Base', status: 'origin', x: 45, y: 70, prompt: 'Plan departure from Delhi' },
    { id: 'goa', name: 'GOA', country: 'India', role: 'Active Trip', status: 'active', x: 125, y: 130, prompt: 'Show my active Goa itinerary and bookings' },
    { id: 'jaipur', name: 'Jaipur', country: 'India', role: 'Heritage Pinned', status: 'pinned', x: 210, y: 55, prompt: 'Plan a 3-day royal palace weekend in Jaipur' },
    { id: 'dubai', name: 'Dubai', country: 'UAE', role: 'Stopover Hub', status: 'hub', x: 295, y: 120, prompt: 'Find luxury transit hotel in Dubai with private desert dining' },
    { id: 'kyoto', name: 'Kyoto', country: 'Japan', role: 'Autumn Plan', status: 'curated', x: 375, y: 65, prompt: 'Plan an 8-day luxury Kyoto & Tokyo cultural trip' },
  ];

  const activeNodeData = nodes.find(n => n.id === hoveredNode) || nodes[1];

  return (
    <div className="bg-[#FFFEFC] rounded-3xl border border-voyage-border/80 p-6 shadow-soft-xs hover:shadow-soft-md transition-all duration-300 flex flex-col justify-between h-full min-h-[320px]">
      {/* Card Header */}
      <div className="flex items-start justify-between pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-voyage-gold/15 text-voyage-gold-dark">
              Travel Intelligence
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold" />
          </div>
          <h3 className="font-serif-luxury text-xl font-bold text-voyage-dark mt-1">
            Your travel map
          </h3>
          <p className="text-xs text-voyage-muted">
            Destinations shaped by your plans
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('explore')}
          className="text-xs font-semibold text-voyage-slate hover:text-voyage-gold-dark flex items-center gap-1 transition-colors group"
        >
          <span>Explore directory</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* SVG Network Canvas */}
      <div className="relative py-2 my-auto">
        <svg
          viewBox="0 0 420 180"
          className="w-full h-36 select-none overflow-visible"
        >
          {/* Subtle ambient glow behind active node */}
          <circle cx="125" cy="130" r="32" fill="rgba(197, 160, 89, 0.08)" />
          <circle cx="125" cy="130" r="20" fill="rgba(197, 160, 89, 0.15)" />

          {/* Curved AI Network Connecting Paths */}
          <path
            d="M 45 70 Q 80 135 125 130"
            fill="none"
            stroke="#C5A059"
            strokeWidth="2.5"
            strokeDasharray="5 3"
            className="transition-all"
          />
          <path
            d="M 125 130 Q 165 75 210 55"
            fill="none"
            stroke="#E5E0D5"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />
          <path
            d="M 210 55 Q 255 130 295 120"
            fill="none"
            stroke="#E5E0D5"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />
          <path
            d="M 295 120 Q 340 55 375 65"
            fill="none"
            stroke="#E5E0D5"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />

          {/* Interactive Destination Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const isActiveTrip = node.status === 'active';

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onClick={() => triggerAIPromptFromAnywhere(node.prompt)}
                className="cursor-pointer group"
              >
                {/* Active Ripple Animation */}
                {isActiveTrip && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="14"
                    fill="rgba(197, 160, 89, 0.3)"
                    className="animate-ping"
                  />
                )}

                {/* Outer Ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActiveTrip ? 9 : isHovered ? 8 : 6}
                  fill={isActiveTrip ? '#C5A059' : isHovered ? '#111827' : '#FFFFFF'}
                  stroke={isActiveTrip ? '#8C6C2D' : isHovered ? '#C5A059' : '#CBD5E1'}
                  strokeWidth={isActiveTrip ? 2.5 : 2}
                  className="transition-all duration-200"
                />

                {/* Inner Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActiveTrip ? 3.5 : 2}
                  fill="#FFFFFF"
                />

                {/* Node Label */}
                <text
                  x={node.x}
                  y={node.y > 100 ? node.y + 18 : node.y - 12}
                  textAnchor="middle"
                  className={`text-[11px] font-sans transition-colors ${
                    isActiveTrip
                      ? 'fill-voyage-dark font-extrabold text-[12px]'
                      : isHovered
                      ? 'fill-voyage-gold-dark font-bold'
                      : 'fill-voyage-slate font-medium'
                  }`}
                >
                  {node.name}
                </text>

                {/* Status Tag */}
                <text
                  x={node.x}
                  y={node.y > 100 ? node.y + 28 : node.y - 22}
                  textAnchor="middle"
                  className={`text-[8px] font-sans uppercase tracking-wider ${
                    isActiveTrip ? 'fill-voyage-gold-dark font-bold' : 'fill-voyage-muted'
                  }`}
                >
                  {isActiveTrip ? '● Active Trip' : node.role}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Context Tooltip */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-voyage-bg/80 border border-voyage-border/80 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-voyage-gold" />
            <span className="font-semibold text-voyage-dark">
              {activeNodeData.name}, {activeNodeData.country}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              activeNodeData.status === 'active' 
                ? 'bg-amber-100 text-voyage-gold-dark font-bold' 
                : 'text-voyage-muted bg-white/60'
            }`}>
              {activeNodeData.status === 'active' ? '● Active Journey' : activeNodeData.role}
            </span>
          </div>

          <button
            onClick={() => triggerAIPromptFromAnywhere(activeNodeData.prompt)}
            className="text-[11px] font-semibold text-voyage-gold-dark hover:text-voyage-dark flex items-center gap-1 transition-colors"
          >
            <span>Ask AI</span>
            <Sparkles className="w-3 h-3 text-voyage-gold" />
          </button>
        </div>
      </div>

      {/* Connected Nodes Pipeline Strip */}
      <div className="pt-2 border-t border-voyage-border/60">
        <div className="flex items-center justify-between text-xs text-voyage-slate overflow-x-auto pb-1 gap-1">
          {nodes.map((n, idx) => (
            <React.Fragment key={n.id}>
              <button
                onClick={() => {
                  setHoveredNode(n.id);
                  triggerAIPromptFromAnywhere(n.prompt);
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  n.status === 'active'
                    ? 'bg-voyage-dark text-white font-bold ring-2 ring-voyage-gold/50 shadow-soft-xs'
                    : 'bg-voyage-bg hover:bg-amber-50 text-voyage-slate hover:text-voyage-dark'
                }`}
              >
                {n.status === 'active' ? '● GOA (Active)' : n.name}
              </button>
              {idx < nodes.length - 1 && (
                <span className="text-voyage-muted/40 font-mono text-[10px]">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
