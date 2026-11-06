// ============================================================
// SITE CONFIGURATION & CONTENT CONSTANTS
// Centralized configuration matching the exact Hero Interface
// ============================================================

export const STORE_INFO = {
  name: import.meta.env.VITE_STORE_NAME || 'SK LABA PHONE',
  country: 'South Korea',
  tagline: 'ලාබ ෆෝන්',
  phone: import.meta.env.VITE_STORE_PHONE || '+82 10-5892-7482',
  whatsapp:
    import.meta.env.VITE_STORE_WHATSAPP ||
    import.meta.env.VITE_WHATSAPP_NUMBER ||
    '+821058927482',
  address: 'Dongdaemun-gu, Seoul, South Korea',
  openingHours: 'Mon - Sun: 10:00 AM - 9:00 PM (KST)',
  email: import.meta.env.VITE_STORE_EMAIL || 'contact@sklabaphone.com',
};

export const NAV_LINKS = [
  { name: 'Home', path: '#' },
  { name: 'Smartphones', path: '#smartphones' },
  { name: 'Giveaways', path: '#giveaways' },
  { name: 'Reviews', path: '#reviews' },
  { name: 'Deals', path: '#deals' },
  { name: 'About Us', path: '#about' },
  { name: 'Contact Us', path: '#contact' },
];

export const HERO_CONTENT = {
  eyebrow: 'PREMIUM SMARTPHONES',
  headlineWhite: 'Find Your Next',
  headlineAccent: 'Smartphone',
  description:
    'Discover flagship performance, everyday essentials, and the latest mobile technology direct from South Korea.',
  primaryBtnText: 'Shop Smartphones',
  secondaryBtnText: 'Explore Deals',
};

export const TRUST_FEATURES = [
  {
    id: 'original',
    icon: 'ShieldCheck',
    title: 'Original Products',
    subtitle: '100% Authentic Korean Stock',
  },
  {
    id: 'delivery',
    icon: 'Truck',
    title: 'Free Islandwide Delivery',
    subtitle: 'Fast & Secure Shipping',
  },
  {
    id: 'payments',
    icon: 'CreditCard',
    title: 'Secure Payments',
    subtitle: 'Installment & Card Options',
  },
  {
    id: 'support',
    icon: 'Headphones',
    title: '24/7 Support',
    subtitle: "We're Here on WhatsApp & Phone",
  },
];

export default {
  STORE_INFO,
  NAV_LINKS,
  HERO_CONTENT,
  TRUST_FEATURES,
};
