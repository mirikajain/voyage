import React from 'react';
import { useApp } from './context/AppContext';
import { TopNavbar } from './components/layout/TopNavbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalAIModal } from './components/layout/GlobalAIModal';
import { FloatingAIButton } from './components/layout/FloatingAIButton';
import { RazorpayCheckoutModal } from './components/common/RazorpayCheckoutModal';

import { HomeView } from './components/home/HomeView';
import { TripsView } from './components/trips/TripsView';
import { TripDetailView } from './components/trips/TripDetailView';
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
      case 'trip-detail':
        return <TripDetailView />;
      case 'explore':
        return <ExploreView />;
      case 'wallet':
        return <WalletView />;
      case 'profile':
        return <ProfileView />;
      case 'concierge':
        return <ConciergeView />;
      case 'notifications':
        return <HomeView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-voyage-dark font-sans flex flex-col transition-colors duration-200">
      {/* Top Horizontal Navbar */}
      <TopNavbar />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-[1536px] mx-auto px-2 sm:px-4">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
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
