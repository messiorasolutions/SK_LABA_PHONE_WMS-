// ============================================================
// SITE CONFIGURATION & CONTENT CONSTANTS
// Centralized configuration matching the exact Hero Interface
// ============================================================

export const STORE_INFO = {
  name: 'SK LABA PHONE',
  country: 'South Korea',
  tagline: 'ලාබ ෆෝන්',
};

export const NAV_LINKS = [
  { name: 'Home', path: '#' },
  { name: 'Smartphones', path: '#smartphones' },
  { name: 'Accessories', path: '#accessories' },
  { name: 'Deals', path: '#deals' },
  { name: 'About', path: '#about' },
];

export const HERO_CONTENT = {
  eyebrow: 'PREMIUM SMARTPHONES & ACCESSORIES',
  headlineWhite: 'Find Your Next',
  headlineAccent: 'Smartphone',
  description:
    'Discover flagship performance, everyday essentials, and the latest mobile technology.',
  primaryBtnText: 'Shop Smartphones',
  secondaryBtnText: 'Explore Deals',
};

export const TRUST_FEATURES = [
  {
    id: 'original',
    icon: 'ShieldCheck',
    title: 'Original Products',
    subtitle: '100% Authentic',
  },
  {
    id: 'delivery',
    icon: 'Truck',
    title: 'Free Islandwide Delivery',
    subtitle: 'Fast & Reliable',
  },
  {
    id: 'payments',
    icon: 'CreditCard',
    title: 'Secure Payments',
    subtitle: 'Multiple Options',
  },
  {
    id: 'support',
    icon: 'Headphones',
    title: '24/7 Support',
    subtitle: "We're Here for You",
  },
];

export default {
  STORE_INFO,
  NAV_LINKS,
  HERO_CONTENT,
  TRUST_FEATURES,
};
