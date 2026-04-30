import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Star, Heart, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Kids.css';

const Kids = ({ addToCart, favorites, toggleFavorite }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const productsRef = useRef(null);

  useEffect(() => {
    let sorted = [...products];
    if (sortBy === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'top-rated') sorted.sort((a, b) => 4.8 - 4.8); // Placeholder for rating
    else sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredProducts(sorted);
  }, [sortBy, products]);

  const sortOptions = [
    { id: 'latest', label: 'Latest' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'name', label: 'Name: A-Z' },
    { id: 'top-rated', label: 'Top Rated' }
  ];

  const currentSortLabel = sortOptions.find(o => o.id === sortBy)?.label;

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/products?category=kids')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error(data.error);
        } else {
          const activeProducts = data.filter(p => p.is_active !== false);
          setProducts(activeProducts);
          setFilteredProducts(activeProducts);
        }
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
          <p>Built on Grit-Defined by Style.</p>
          <button className="primary-btn" onClick={scrollToProducts}>Shop Now</button>
        </div>
      </section>

      {/* Product Grid */}
      <section className="products-section" ref={productsRef}>
        <div className="section-header">
          <h2>Kids Collection</h2>
          
          <div className="filter-controls">
            <div className="sort-container">
              <div className="sort-trigger" onClick={() => setIsSortOpen(!isSortOpen)}>
                <SlidersHorizontal size={18} className="filter-icon" />
                <div className="sort-box">
                  <span>{currentSortLabel}</span>
                  <ChevronDown size={16} />
                </div>
              </div>
              
              {isSortOpen && (
                <div className="sort-dropdown">
                  {sortOptions.map(option => (
                    <div 
                      key={option.id} 
                      className={`sort-option ${sortBy === option.id ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(option.id);
                        setIsSortOpen(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="product-grid">
          {loading ? (
            <p style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>Loading trending collection...</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>No products available yet.</p>
          ) : (
            filteredProducts.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-image-container">
                <Link to={`/product/${product._id}`}>
                  <img src={product.images && product.images[0]} alt={product.name} />
                </Link>
                {product.tag && <span className="product-tag">{product.tag}</span>}
                <button 
                  className={`fav-btn ${favorites.find(f => f._id === product._id) ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); toggleFavorite(product); }}
                >
                  <Heart size={20} fill={favorites.find(f => f._id === product._id) ? "#e50010" : "none"} />
                </button>
                <div className="product-overlay">
                  <Link to={`/product/${product._id}`} className="quick-add-btn">
                    <ShoppingBag size={18} /> View Details
                  </Link>
                </div>
              </div>
              <div className="product-info">
                <div className="product-header">
                  <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3>{product.name}</h3>
                  </Link>
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
