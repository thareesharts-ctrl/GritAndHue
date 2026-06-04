import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="footer-container">
      {/* Trust Badges - Premium E-Commerce Touch */}
      <div className="footer-trust-badges">
        <div className="badge-item">
          <Truck size={24} strokeWidth={1.5} />
          <div className="badge-text">
            <h4>Free Shipping</h4>
            <p>On orders above Rs. 1000</p>
          </div>
        </div>
        <div className="badge-item">
          <RotateCcw size={24} strokeWidth={1.5} />
          <div className="badge-text">
            <h4>Easy Returns</h4>
            <p>7-day hassle-free returns</p>
          </div>
        </div>
        <div className="badge-item">
          <ShieldCheck size={24} strokeWidth={1.5} />
          <div className="badge-text">
            <h4>100% Secure Checkout</h4>
          </div>
        </div>
      </div>

      <hr className="footer-divider" />

      {/* Main Footer Links & Info */}
      <div className="footer-main-grid">
        {/* Brand Description & Socials */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-logo-link">
            <img src="/assets/Home page/logo.png" alt="Grit and Hue Logo" className="footer-logo" />
          </Link>
          <p className="brand-pitch">
            Premium everyday fashion carefully curated for comfort, style, and expression. Discover clothing that lets you embrace your grit and define your hue.
          </p>
          <div className="social-links">
            <a href="https://www.instagram.com/_.day_by_day_menswear._?igsh=MWxnNmJuNDFxc2lrbg==" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          </div>
        </div>

        {/* Shop Category Links */}
        <div className="footer-links-col">
          <h3>Shop</h3>
          <ul>
            <li><Link to="/men">Men's Wear</Link></li>
            <li><Link to="/kids">Kids' Wear</Link></li>
            <li><Link to="/favorites">My Favorites</Link></li>
            <li><Link to="/cart">Shopping Bag</Link></li>
          </ul>
        </div>

        {/* Support Links */}
        <div className="footer-links-col">
          <h3>Customer Support</h3>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><a href="#shipping">Shipping & Delivery</a></li>
            <li><a href="#returns">Exchange & Returns</a></li>
            <li><a href="#faqs">FAQs</a></li>
            <li><a href="#size-guide">Size Guide</a></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div className="footer-newsletter-col">
          <h3>Stay Updated</h3>
          <p className="newsletter-desc">Subscribe to receive first access to new collections, exclusive sales, and stories.</p>
          <form onSubmit={handleSubscribe} className="newsletter-form">
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-submit-btn" aria-label="Subscribe">
                <ArrowRight size={18} />
              </button>
            </div>
            {subscribed && (
              <span className="subscribe-success-msg">Thank you! Welcome to Grit & Hue.</span>
            )}
          </form>
          
          <div className="contact-quick-info">
            <div className="contact-item">
              <Phone size={14} />
              <span>+91 93422 15498</span>
            </div>
            <div className="contact-item">
              <Mail size={14} />
              <span>support@gritandhue.com</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="footer-divider" />

      {/* Bottom Copyright & Payments */}
      <div className="footer-bottom-flex">
        <div className="copyright-text">
          <p>&copy; {new Date().getFullYear()} Grit and Hue. All rights reserved.</p>
          <div className="legal-links">
            <a href="#privacy">Privacy Policy</a>
            <span className="dot-divider"></span>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>

      
      </div>
    </footer>
  );
};

export default Footer;
