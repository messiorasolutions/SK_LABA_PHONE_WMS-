import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import HomePage from './pages/HomePage';
import SmartphonesPage from './pages/SmartphonesPage';
import FavoritesModal from './components/Modals/FavoritesModal';
import PhoneDetailModal from './components/Modals/PhoneDetailModal';
import ReservationModal from './components/Modals/ReservationModal';
import InquiryModal from './components/Modals/InquiryModal';
import { setActiveTab } from './actions/heroActions';

export default function App() {
  const dispatch = useDispatch();
  const { activeTab } = useSelector((state) => state.hero || { activeTab: 'Home' });

  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [selectedPhoneForDetail, setSelectedPhoneForDetail] = useState(null);
  const [selectedPhoneForReserve, setSelectedPhoneForReserve] = useState(null);
  const [inquiryModalData, setInquiryModalData] = useState(null); // { phone: phoneObj | null } when open

  // Sync route / hash on initial mount and browser back/forward
  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      if (hash === '#smartphones' || pathname === '/smartphones') {
        dispatch(setActiveTab('Smartphones'));
      } else if (hash === '' || hash === '#' || hash === '#home' || pathname === '/') {
        dispatch(setActiveTab('Home'));
      }
    };

    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);

    const handleOpenFav = () => setFavoritesModalOpen(true);
    window.addEventListener('sk_laba_open_favorites_modal', handleOpenFav);

    const handleOpenInquiry = (e) => {
      setInquiryModalData({ phone: e.detail?.phone || null });
    };
    window.addEventListener('sk_laba_open_inquiry_modal', handleOpenInquiry);

    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('sk_laba_open_favorites_modal', handleOpenFav);
      window.removeEventListener('sk_laba_open_inquiry_modal', handleOpenInquiry);
    };
  }, [dispatch]);

  const handleNavigateToSmartphones = () => {
    dispatch(setActiveTab('Smartphones'));
    window.location.hash = '#smartphones';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToHome = () => {
    dispatch(setActiveTab('Home'));
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSmartphonesPage = activeTab === 'Smartphones';

  return (
    <div className="min-h-screen bg-theme-bg text-theme-textPrimary flex flex-col selection:bg-theme-accent selection:text-white">
      {/* Navigation Header */}
      <Navbar onOpenFavorites={() => setFavoritesModalOpen(true)} />

      {/* Distinct Separate Pages */}
      <main className="flex-1">
        {isSmartphonesPage ? (
          /* Separate Dedicated Smartphones Page (C-02 & C-03) */
          <SmartphonesPage onNavigateToHome={handleNavigateToHome} />
        ) : (
          /* Separate Dedicated Home Page (C-01) */
          <HomePage onNavigateToSmartphones={handleNavigateToSmartphones} />
        )}
      </main>

      {/* Shop Information & Footer (C-01 & C-08) */}
      <Footer />

      {/* Global Favorites Modal triggered from Navbar (C-06) */}
      {favoritesModalOpen && (
        <FavoritesModal
          onClose={() => setFavoritesModalOpen(false)}
          onViewPhoneDetails={(p) => setSelectedPhoneForDetail(p)}
          onReservePhone={(p) => setSelectedPhoneForReserve(p)}
        />
      )}

      {/* Detail Modal if opened from favorites */}
      {selectedPhoneForDetail && (
        <PhoneDetailModal
          phone={selectedPhoneForDetail}
          onClose={() => setSelectedPhoneForDetail(null)}
          onOpenReserve={(p) => {
            setSelectedPhoneForReserve(p);
            setSelectedPhoneForDetail(null);
          }}
          onOpenInquiry={(p) => {
            setInquiryModalData({ phone: p });
            setSelectedPhoneForDetail(null);
          }}
        />
      )}

      {/* Reservation Modal if opened from favorites */}
      {selectedPhoneForReserve && (
        <ReservationModal
          phone={selectedPhoneForReserve}
          onClose={() => setSelectedPhoneForReserve(null)}
        />
      )}

      {/* Global Customer Inquiry Modal (PDF 1 / C-08) */}
      {inquiryModalData && (
        <InquiryModal
          phone={inquiryModalData.phone}
          onClose={() => setInquiryModalData(null)}
        />
      )}
    </div>
  );
}
