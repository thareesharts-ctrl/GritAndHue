import React, { useState } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="navbar-container">
      {/* Top Banner */}
      <div className="top-banner">
        <span className="promo-text">FLAT 15% OFF FOR THE WEEKEND</span>

      </div>

      {/* Main Navigation */}
      <nav className="main-nav">
        {/* Mobile Hamburger */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <div className="logo-container">
          <Link to="/" className="logo-text">DAY BY DAY</Link>
        </div>

        {/* Navigation Links & Mobile Icons */}
        <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <li><Link to="/men">MEN</Link></li>
          <li><Link to="/kids">KIDS</Link></li>
          
          <li className="mobile-only-icon"><a href="#account"><User size={20} /> ACCOUNT</a></li>
          <li className="mobile-only-icon"><a href="#favorites"><Heart size={20} /> FAVORITES</a></li>
          <li className="mobile-only-icon"><a href="#cart"><ShoppingBag size={20} /> CART</a></li>
        </ul>

        {/* Right Icons */}
        <div className="nav-icons">
          <a href="#search" aria-label="Search"><Search size={22} strokeWidth={1.5} /></a>
          <a href="#account" aria-label="Account" className="desktop-only-icon"><User size={22} strokeWidth={1.5} /></a>
          <a href="#favorites" aria-label="Favorites" className="desktop-only-icon"><Heart size={22} strokeWidth={1.5} /></a>
          <a href="#cart" aria-label="Shopping Bag" className="desktop-only-icon"><ShoppingBag size={22} strokeWidth={1.5} /></a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
