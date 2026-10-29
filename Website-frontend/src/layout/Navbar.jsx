import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, User, ShoppingCart, Menu, X } from 'lucide-react';
import logoImg from '../assets/images/logo.png';
import { setActiveTab, setSearchQuery } from '../actions/heroActions';
import { NAV_LINKS, STORE_INFO } from '../constants/siteConfig';

export default function Navbar() {
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const { activeTab, searchQuery, cartCount } = useSelector((state) => state.hero);

  const handleTabClick = (tabName, e) => {
    e.preventDefault();
    dispatch(setActiveTab(tabName));
    setMobileMenuOpen(false);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full bg-transparent transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          
          {/* Left: SK LABA Brand Logo (Enlarged) */}
          <a
            href="#"
            onClick={(e) => handleTabClick('Home', e)}
            className="flex items-center gap-3 shrink-0 group py-2"
          >
            <img
              src={logoImg}
              alt={STORE_INFO.name}
              className="h-14 sm:h-16 md:h-18 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-md"
            />
          </a>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {NAV_LINKS.map((link) => {
              const isActive = activeTab === link.name;

              return (
                <a
                  key={link.name}
                  href={`#${link.name.toLowerCase()}`}
                  onClick={(e) => handleTabClick(link.name, e)}
                  className="relative py-2 text-sm font-medium transition-colors duration-150"
                >
                  <span
                    className={
                      isActive
                        ? 'text-theme-textPrimary font-semibold'
                        : 'text-theme-textSecondary hover:text-theme-textPrimary'
                    }
                  >
                    {link.name}
                  </span>

                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-theme-accent rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right: Search, Account & Cart */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Input Bar */}
            <div className="relative hidden sm:block w-64 md:w-72 lg:w-80">
              <div className="flex items-center bg-theme-input/70 backdrop-blur-md border border-theme-borderMedium rounded-full px-3.5 py-2 text-sm text-theme-textSecondary focus-within:border-theme-accent focus-within:ring-1 focus-within:ring-theme-accent transition-all shadow-inner">
                <Search className="w-4 h-4 text-theme-textMuted mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  placeholder="Search for smartphones, brands, accessories..."
                  className="bg-transparent border-none outline-none text-xs md:text-sm text-theme-textPrimary placeholder-theme-textMuted w-full"
                />
              </div>
            </div>

            {/* User Profile Button */}
            <button
              type="button"
              className="p-2 rounded-full text-theme-textSecondary hover:text-theme-textPrimary hover:bg-white/5 transition-colors cursor-pointer"
              title="User Account"
              aria-label="User Account"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Shopping Cart Button */}
            <button
              type="button"
              className="relative p-2 rounded-full text-theme-textSecondary hover:text-theme-textPrimary hover:bg-white/5 transition-colors cursor-pointer"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-theme-accent text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-theme-textSecondary hover:text-theme-textPrimary cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="sm:hidden pb-3">
          <div className="flex items-center bg-theme-input/80 backdrop-blur-md border border-theme-borderMedium rounded-full px-3.5 py-1.5 text-sm text-theme-textSecondary">
            <Search className="w-4 h-4 text-theme-textMuted mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              placeholder="Search for smartphones, brands..."
              className="bg-transparent border-none outline-none text-xs text-theme-textPrimary placeholder-theme-textMuted w-full"
            />
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 bg-theme-surface/95 backdrop-blur-lg border border-theme-border rounded-2xl px-3 my-2 space-y-1 shadow-2xl">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={`#${link.name.toLowerCase()}`}
                onClick={(e) => handleTabClick(link.name, e)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === link.name
                    ? 'bg-theme-accent/20 text-theme-textPrimary font-semibold'
                    : 'text-theme-textSecondary hover:bg-white/5 hover:text-theme-textPrimary'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
