import React, { useState } from 'react';
import { 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ChevronDown, 
  ArrowRight, 
  Building, 
  Plane, 
  UtensilsCrossed, 
  Compass, 
  Car 
} from 'lucide-react';
import { mockTransactions } from '../../data/mockData';

export const WalletView: React.FC = () => {
  const [selectedTripFilter, setSelectedTripFilter] = useState('All Trips');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const categories = [
    {
      name: 'Hotels',
      spent: 40000,
      total: 40000,
      percentage: 100,
      iconBg: 'bg-amber-100 text-amber-700',
      barColor: 'bg-red-500',
      icon: Building,
    },
    {
      name: 'Flights',
      spent: 34000,
      total: 55000,
      percentage: 60,
      iconBg: 'bg-emerald-100 text-emerald-700',
      barColor: 'bg-amber-500',
      icon: Plane,
    },
    {
      name: 'Food',
      spent: 18300,
      total: 25000,
      percentage: 73,
      iconBg: 'bg-rose-100 text-rose-700',
      barColor: 'bg-blue-500',
      icon: UtensilsCrossed,
    },
    {
      name: 'Activities',
      spent: 8200,
      total: 20000,
      percentage: 41,
      iconBg: 'bg-blue-100 text-blue-700',
      barColor: 'bg-emerald-500',
      icon: Compass,
    },
    {
      name: 'Transport',
      spent: 4000,
      total: 10000,
      percentage: 40,
      iconBg: 'bg-indigo-100 text-indigo-700',
      barColor: 'bg-indigo-500',
      icon: Car,
    },
  ];

  const getTxIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return <UtensilsCrossed className="w-4 h-4 text-rose-600" />;
      case 'transport':
        return <Car className="w-4 h-4 text-indigo-600" />;
      case 'hotels':
        return <Building className="w-4 h-4 text-amber-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl pb-16">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#121826] tracking-tight">
            Travel Wallet & Budget
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Track your travel expenses, budgets, and transactions in real time.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E0D5] text-xs font-semibold text-[#121826] shadow-xs hover:bg-neutral-50 cursor-pointer"
          >
            <span className="text-[#94A3B8] font-normal">Trip</span>
            <span>{selectedTripFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </button>

          {filterMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E5E0D5] rounded-xl shadow-lg z-20 py-1 text-xs">
              {['All Trips', 'Goa 2024', 'Paris 2024'].map((trip) => (
                <button
                  key={trip}
                  type="button"
                  onClick={() => {
                    setSelectedTripFilter(trip);
                    setFilterMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#F8F6F1] font-medium text-[#121826]"
                >
                  {trip}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total Spent */}
        <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-[#475569] flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748B] font-medium">Total Spent</p>
            <p className="text-2xl font-bold text-[#121826] tracking-tight mt-0.5">₹1,32,400</p>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12% from last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Budget */}
        <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-[#475569] flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#64748B] font-medium">Total Budget</p>
            <p className="text-2xl font-bold text-[#121826] tracking-tight mt-0.5">₹2,00,000</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                <span>66% used</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '66%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Remaining */}
        <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#64748B] font-medium">Remaining</p>
            <p className="text-2xl font-bold text-[#121826] tracking-tight mt-0.5">₹67,600</p>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Within budget</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Spending by Category */}
      <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-[#121826]">Spending by Category</h2>
          <span className="font-bold text-base text-[#121826]">₹1,32,400</span>
        </div>

        {/* Multi-colored segmented bar */}
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full overflow-hidden flex">
            <div className="h-full bg-red-500" style={{ width: '30%' }} title="Hotels (30%)" />
            <div className="h-full bg-amber-500" style={{ width: '22%' }} title="Flights (22%)" />
            <div className="h-full bg-blue-500" style={{ width: '14%' }} title="Food (14%)" />
            <div className="h-full bg-emerald-500" style={{ width: '16%' }} title="Activities (16%)" />
            <div className="h-full bg-indigo-500" style={{ width: '18%' }} title="Transport (18%)" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#64748B] pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Hotels (30%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Flights (22%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Food (14%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Activities (16%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Transport (10%)
            </span>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div 
                key={cat.name} 
                className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl p-3.5 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-lg ${cat.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#121826]">{cat.name}</p>
                  <p className="text-[11px] text-[#64748B]">
                    ₹{cat.spent.toLocaleString('en-IN')} <span className="text-[#94A3B8]">/ ₹{cat.total.toLocaleString('en-IN')}</span>
                  </p>
                  <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden mt-1.5">
                    <div className={`h-full ${cat.barColor} rounded-full`} style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#121826]">
                  {cat.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Transactions */}
      <div className="bg-white rounded-2xl border border-[#ECE7DC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-[#121826]">Recent Transactions</h2>
          <button 
            type="button" 
            className="text-xs font-semibold text-[#121826] hover:text-[#C5A059] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>All Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {mockTransactions.map((tx) => (
            <div 
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors border-b border-[#F0ECE4] last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                  {getTxIcon(tx.category)}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#121826] leading-tight">
                    {tx.title}
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    {tx.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-bold text-[#121826]">
                  ₹{tx.amount.toLocaleString('en-IN')}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  Paid
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
