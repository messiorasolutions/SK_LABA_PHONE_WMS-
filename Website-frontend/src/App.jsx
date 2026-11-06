import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import HomePage from './pages/HomePage';
import SmartphonesPage from './pages/SmartphonesPage';
import ContactPage from './pages/ContactPage';
import GiveawaysPage from './pages/GiveawaysPage';
import FavoritesModal from './components/Modals/FavoritesModal';
import PhoneDetailModal from './components/Modals/PhoneDetailModal';
import ReservationModal from './components/Modals/ReservationModal';
import InquiryModal from './components/Modals/InquiryModal';
import CartModal from './components/Modals/CartModal';
import SellPhoneModal from './components/Modals/SellPhoneModal';
import ReviewModal from './components/Modals/ReviewModal';
import BackInStockModal from './components/Modals/BackInStockModal';
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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedPhoneForBackInStock, setSelectedPhoneForBackInStock] = useState(null);

  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      if (hash === '#smartphones' || pathname === '/smartphones') {
        dispatch(setActiveTab('Smartphones'));
      } else if (hash === '#giveaways' || pathname === '/giveaways') {
        dispatch(setActiveTab('Giveaways'));
      } else if (hash === '#contact' || pathname === '/contact') {
        dispatch(setActiveTab('Contact Us'));
      } else if (hash === '' || hash === '#' || hash === '#home' || hash === '#reviews' || hash === '#about' || pathname === '/') {
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

    const handleOpenReview = () => setReviewModalOpen(true);
    window.addEventListener('sk_laba_open_review_modal', handleOpenReview);

    const handleOpenBackInStock = (e) => {
      setSelectedPhoneForBackInStock(e?.detail?.phone || null);
    };
    window.addEventListener('sk_laba_open_back_in_stock_modal', handleOpenBackInStock);

    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('sk_laba_open_favorites_modal', handleOpenFav);
      window.removeEventListener('sk_laba_open_cart_modal', handleOpenCart);
      window.removeEventListener('sk_laba_open_inquiry_modal', handleOpenInquiry);
      window.removeEventListener('sk_laba_open_sell_modal', handleOpenSell);
      window.removeEventListener('sk_laba_open_review_modal', handleOpenReview);
      window.removeEventListener('sk_laba_open_back_in_stock_modal', handleOpenBackInStock);
    };
  }, [dispatch]);

  const handleNavigateToSmartphones = (phone) => {
    dispatch(setActiveTab('Smartphones'));
    window.location.hash = '#smartphones';
    if (phone) {
      setSelectedPhoneForDetail(phone);
    }
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
        {activeTab === 'Smartphones' ? (
          <SmartphonesPage onNavigateToHome={handleNavigateToHome} />
        ) : activeTab === 'Giveaways' ? (
          <GiveawaysPage onNavigateToHome={handleNavigateToHome} />
        ) : activeTab === 'Contact Us' || activeTab === 'Contact' ? (
          <ContactPage onNavigateToHome={handleNavigateToHome} />
        ) : (
          <HomePage onNavigateToSmartphones={handleNavigateToSmartphones} onOpenSell={() => setSellModalData({})} onOpenReview={() => setReviewModalOpen(true)} />
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black">
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
            onOpenNotifyBackInStock={(p) => {
              setSelectedPhoneForBackInStock(p);
              setSelectedPhoneForDetail(null);
            }}
          />
        </div>
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

      {reviewModalOpen && (
        <ReviewModal
          onClose={() => setReviewModalOpen(false)}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent('sk_laba_review_submitted'));
          }}
        />
      )}

      {selectedPhoneForBackInStock && (
        <BackInStockModal
          phone={selectedPhoneForBackInStock}
          onClose={() => setSelectedPhoneForBackInStock(null)}
        />
      )}
    </div>
  );
}
