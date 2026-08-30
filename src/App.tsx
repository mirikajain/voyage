import React from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { GlobalAIModal } from './components/layout/GlobalAIModal';
import { FloatingAIButton } from './components/layout/FloatingAIButton';
import { RazorpayCheckoutModal } from './components/common/RazorpayCheckoutModal';

import { HomeView } from './components/home/HomeView';
import { TripsView } from './components/trips/TripsView';
import { ExploreView } from './components/explore/ExploreView';
import { WalletView } from './components/wallet/WalletView';
import { ProfileView } from './components/profile/ProfileView';
import { ConciergeView } from './components/concierge/ConciergeView';

export const MainContent: React.FC = () => {
  const { currentPage } = useApp();

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'home':
        return <HomeView />;
      case 'trips':
        return <TripsView />;
      case 'explore':
        return <ExploreView />;
      case 'wallet':
        return <WalletView />;
      case 'profile':
        return <ProfileView />;
      case 'concierge':
        return <ConciergeView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-voyage-bg text-voyage-dark font-sans">
      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navigation Header */}
        <MobileNav />

        {/* Dynamic Page Container */}
        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Floating AI Trigger Button */}
      <FloatingAIButton />

      {/* Global AI Ingestion Modal */}
      <GlobalAIModal />

      {/* Razorpay Tokenized Checkout Simulation Modal */}
      <RazorpayCheckoutModal />
    </div>
  );
};

export function App() {
  return <MainContent />;
}

export default App;
