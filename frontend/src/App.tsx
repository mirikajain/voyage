import React from 'react';
import { useApp } from './context/AppContext';
import { TopNavbar } from './components/layout/TopNavbar';
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
    <div className="min-h-screen bg-voyage-bg text-voyage-dark font-sans flex flex-col transition-colors duration-300">
      {/* Compact Horizontal Top Navigation */}
      <TopNavbar />

      {/* Dynamic Main Dashboard Container */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
        {renderCurrentView()}
      </main>

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
