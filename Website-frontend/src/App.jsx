import React from 'react';
import Navbar from './layout/Navbar';
import HeroSection from './components/HeroSection';
import TrustBadges from './components/TrustBadges';

export default function App() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-textPrimary flex flex-col justify-between selection:bg-theme-accent selection:text-white">
      {/* Top: Transparent Header overlaid seamlessly on Hero Image */}
      <div className="relative">
        <Navbar />
        <HeroSection />
      </div>

      {/* Bottom: Trust Badges bar placed cleanly below the hero image */}
      <TrustBadges />
    </div>
  );
}
