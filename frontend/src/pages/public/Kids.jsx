import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star } from 'lucide-react';
import './Kids.css';

const Kids = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/products?category=kids')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching kids products:', err);
        setLoading(false);
      });
  }, []);
  return (
    <div className="kids-page">
      {/* Hero Section */}
      <section className="kids-hero">
        <div className="mobile-slideshow">
          <div className="slide slide-1"></div>
          <div className="slide slide-2"></div>
          <div className="slide slide-3"></div>
          <div className="slide slide-4"></div>
          <div className="slide slide-5"></div>
        </div>
        <div className="hero-content">
          <span className="hero-badge">NEW COLLECTION</span>
          <h1>Playful Style<br/>Everyday Comfort</h1>
          <p>Discover our latest kids' collection designed for adventures, featuring soft fabrics and vibrant colors.</p>
          <button className="primary-btn">Shop Now</button>
        </div>
      </section>

      {/* Product Grid */}
      <section className="products-section">
        <div className="section-header">
          <h2>Trending for Kids</h2>
          <div className="filter-tabs">
            <button className="active">All</button>
            <button>Boys</button>
            <button>Girls</button>
            <button>Baby</button>
          </div>
        </div>

        <div className="product-grid">
          {loading ? (
            <p style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>Loading trending collection...</p>
          ) : products.length === 0 ? (
            <p style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>No products available yet.</p>
          ) : (
            products.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-image-container">
                <img src={product.image_url} alt={product.name} />
                {product.tag && <span className="product-tag">{product.tag}</span>}
                <div className="product-overlay">
                  <button className="quick-add-btn">
                    <ShoppingBag size={18} /> Quick Add
                  </button>
                </div>
              </div>
              <div className="product-info">
                <div className="product-header">
                  <h3>{product.name}</h3>
                  <div className="product-rating">
                    <Star size={14} fill="#f5c518" color="#f5c518" />
                    <span>4.8</span>
                  </div>
                </div>
                <p className="product-price">Rs. {product.price}</p>
              </div>
            </div>
          )))}
        </div>
      </section>
    </div>
  );
};

export default Kids;
