import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, ArrowLeft, Heart, Share2, ShieldCheck, Truck, RotateCcw, AlertCircle } from 'lucide-react';
import './ProductDetails.css';

const ProductDetails = ({ addToCart, favorites, toggleFavorite }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/api/v1/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setProduct(data);
          if (data.images && data.images.length > 0) {
            setActiveImage(data.images[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load product details.');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading-state">Loading product details...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!product) return <div className="error-state">Product not found.</div>;

  const handleWhatsAppOrder = () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      setSizeError(true);
      return;
    }
    const message = `Hi Grit and Hue! I'm interested in ordering:
Product: ${product.name}
Size: ${selectedSize || 'N/A'}
Price: Rs. ${product.price}
Link: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/9655673073?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      setSizeError(true);
      return;
    }
    addToCart(product, selectedSize);
  };

  return (
    <div className="product-details-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back to Catalog
        </button>

        <div className="details-wrapper">
          {/* Left: Image Section */}
          <div className="image-section">
            <div className="main-image-container">
              <img src={activeImage} alt={product.name} />
              {product.tag && <span className="detail-tag">{product.tag}</span>}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-strip">
                {product.images.map((img, index) => (
                  <div 
                    key={index} 
                    className={`thumbnail-box ${activeImage === img ? 'active' : ''}`}
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} alt={`Thumbnail ${index}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info Section */}
          <div className="info-section">
            <div className="info-header">
              <span className="category-label">{product.category.toUpperCase()} WEAR</span>
              <div className="info-actions">
                <button 
                  className={`icon-btn ${favorites.find(f => f._id === product._id) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(product)}
                >
                  <Heart size={20} fill={favorites.find(f => f._id === product._id) ? "#e50010" : "none"} color={favorites.find(f => f._id === product._id) ? "#e50010" : "#111"} />
                </button>
                <button className="icon-btn"><Share2 size={20} /></button>
              </div>
            </div>

            <h1 className="product-title">{product.name}</h1>
            
            <div className="rating-row">
              <div className="stars">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={16} fill={s <= 4 ? "#f5c518" : "none"} color={s <= 4 ? "#f5c518" : "#ccc"} />
                ))}
              </div>
              <span className="rating-text">4.8 (120 Reviews)</span>
            </div>

            <div className="price-row">
              <span className="current-price">Rs. {product.price}</span>
              <span className="mrp">MRP Incl. of all taxes</span>
            </div>

            <div className="description-box">
              <h3>Description</h3>
              <p>{product.description || "No description provided for this premium item."}</p>
            </div>

            <div className={`size-selector ${sizeError ? 'error-shake' : ''}`}>
              <div className="size-header">
                <h3>Select Size {sizeError && <span className="error-text"><AlertCircle size={14} /> Please select a size</span>}</h3>
                <button className="size-chart">Size Chart</button>
              </div>
              <div className="size-options">
                {product.sizes && product.sizes.length > 0 
                  ? product.sizes.map(size => (
                      <button 
                        key={size} 
                        className={`size-btn ${product.category === 'kids' ? 'kids-size' : ''} ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => { setSelectedSize(size); setSizeError(false); }}
                      >
                        {size}
                      </button>
                    ))
                  : <p className="no-sizes">Contact for available sizes</p>
                }
              </div>
            </div>

            <div className="action-buttons">
              <button className="order-whatsapp-btn" onClick={handleWhatsAppOrder}>
                ORDER ON WHATSAPP
              </button>
              <button className="add-cart-btn" onClick={handleAddToCart}>
                <ShoppingBag size={20} /> ADD TO BAG
              </button>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="badge-item">
                <Truck size={20} />
                <span>Fast Delivery</span>
              </div>
              <div className="badge-item">
                <RotateCcw size={20} />
                <span>7 Days Return</span>
              </div>
              <div className="badge-item">
                <ShieldCheck size={20} />
                <span>100% Original</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
