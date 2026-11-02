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
import CartModal from './components/Modals/CartModal';
import SellPhoneModal from './components/Modals/SellPhoneModal';
import { setActiveTab } from './actions/heroActions';

export default function App() {
  const dispatch = useDispatch();
  const { activeTab } = useSelector((state) => state.hero || { activeTab: 'Home' });

  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [selectedPhoneForDetail, setSelectedPhoneForDetail] = useState(null);
  const [selectedPhoneForReserve, setSelectedPhoneForReserve] = useState(null);
  const [inquiryModalData, setInquiryModalData] = useState(null);
  const [sellModalData, setSellModalData] = useState(null);

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

    function handleOpenFav() {
      setFavoritesModalOpen(true);
    }
    window.addEventListener('sk_laba_open_favorites_modal', handleOpenFav);

    function handleOpenCart() {
      setCartModalOpen(true);
    }
    window.addEventListener('sk_laba_open_cart_modal', handleOpenCart);

    function handleOpenInquiry(e) {
      setInquiryModalData({ phone: e?.detail?.phone || null });
    }
    window.addEventListener('sk_laba_open_inquiry_modal', handleOpenInquiry);

    const handleOpenSell = (e) => {
      setSellModalData({ desiredPhone: e.detail?.desiredPhone || null });
    };
    window.addEventListener('sk_laba_open_sell_modal', handleOpenSell);

    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('sk_laba_open_favorites_modal', handleOpenFav);
      window.removeEventListener('sk_laba_open_cart_modal', handleOpenCart);
      window.removeEventListener('sk_laba_open_inquiry_modal', handleOpenInquiry);
      window.removeEventListener('sk_laba_open_sell_modal', handleOpenSell);
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
      <Navbar onOpenFavorites={() => setFavoritesModalOpen(true)} onOpenCart={() => setCartModalOpen(true)} />

      <main className="flex-1">
        {isSmartphonesPage ? (
          <SmartphonesPage onNavigateToHome={handleNavigateToHome} />
        ) : (
          <HomePage onNavigateToSmartphones={handleNavigateToSmartphones} onOpenSell={() => setSellModalData({})} />
        )}
      </main>

      <Footer onOpenSell={() => setSellModalData({ desiredPhone: null })} />

      {/* Shopping Cart Modal (C-06) */}
      <CartModal
        isOpen={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        onCheckout={(items) => {
          if (items.length > 0) {
            setSelectedPhoneForReserve({
              phone_id: items[0].phone_id,
              name: items[0].name,
              selectedColor: items[0].color,
              selectedStorage: items[0].storage,
              price: items[0].price,
              image_url: items[0].photo,
            });
          }
        }}
      />

      {/* Global Favorites Modal triggered from Navbar (C-06) */}
      {favoritesModalOpen && (
        <FavoritesModal
          onClose={() => setFavoritesModalOpen(false)}
          onViewPhoneDetails={(p) => setSelectedPhoneForDetail(p)}
          onReservePhone={(p) => setSelectedPhoneForReserve(p)}
        />
      )}

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
          onOpenSell={(p) => {
            setSellModalData({ desiredPhone: p });
            setSelectedPhoneForDetail(null);
          }}
        />
      )}

      {selectedPhoneForReserve && (
        <ReservationModal
          phone={selectedPhoneForReserve}
          onClose={() => setSelectedPhoneForReserve(null)}
        />
      )}

      {inquiryModalData && (
        <InquiryModal
          phone={inquiryModalData.phone}
          onClose={() => setInquiryModalData(null)}
        />
      )}

      {sellModalData && (
        <SellPhoneModal
          desiredPhone={sellModalData.desiredPhone}
          onClose={() => setSellModalData(null)}
        />
      )}
    </div>
  );
}
