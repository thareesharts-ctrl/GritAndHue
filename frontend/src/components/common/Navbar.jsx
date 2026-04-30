import React, { useState } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ cartCount, favCount, user, setUser, clearCart }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('favorites');
    clearCart();
    setUser(null);
    window.location.href = '/';
  };

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
          <Link to="/" className="logo-link">
            <img src="/assets/Home page/logo.png" alt="Grit and Hue Logo" className="navbar-logo" />
          </Link>
        </div>

        {/* Navigation Links & Mobile Icons */}
        <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <li><Link to="/men">MEN</Link></li>
          <li><Link to="/kids">KIDS</Link></li>
          
          <li className="mobile-only-icon"><Link to="/login"><User size={20} /> ACCOUNT</Link></li>
          <li className="mobile-only-icon">
            <Link to="/favorites" className="cart-icon-wrapper">
              <Heart size={20} /> 
              {favCount > 0 && <span className="cart-badge">{favCount}</span>}
              FAVORITES
            </Link>
          </li>
          <li className="mobile-only-icon">
            <Link to="/cart" className="cart-icon-wrapper">
              <ShoppingBag size={20} /> 
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              CART
            </Link>
          </li>
        </ul>

        {/* Right Icons */}
        <div className="nav-icons">
          {user && (
            <div className="compact-auth-desktop">
              <span className="user-name-small">Hi, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="logout-text-link">Logout</button>
              <div className="divider-small"></div>
            </div>
          )}
          <a href="#search" aria-label="Search"><Search size={22} strokeWidth={1.5} /></a>
          <Link to="/login" aria-label="Account" className="desktop-only-icon"><User size={22} strokeWidth={1.5} /></Link>
          <Link to="/favorites" aria-label="Favorites" className="desktop-only-icon cart-icon-wrapper">
            <Heart size={22} strokeWidth={1.5} />
            {favCount > 0 && <span className="cart-badge">{favCount}</span>}
          </Link>
          <Link to="/cart" aria-label="Shopping Bag" className="desktop-only-icon cart-icon-wrapper">
            <ShoppingBag size={22} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
