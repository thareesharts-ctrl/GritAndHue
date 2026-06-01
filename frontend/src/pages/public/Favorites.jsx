import React, { useState } from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../components/common/ConfirmModal';
import './Favorites.css';

const Favorites = ({ favorites, toggleFavorite, addToCart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);

  const handleRemove = (product) => {
    setProductToRemove(product);
    setIsModalOpen(true);
  };

  if (favorites.length === 0) {
    return (
      <div className="empty-fav-page">
        <div className="empty-fav-content">
          <Heart size={80} strokeWidth={1} color="#ccc" />
          <h2>Your wishlist is empty</h2>
          <p>Save your favorite items here to check them out later.</p>
          <Link to="/kids" className="shop-now-btn">Explore Collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="container">
        <h1 className="fav-title">My Favorites ({favorites.length})</h1>
        
        <div className="fav-grid">
          {favorites.map((product) => (
            <div key={product._id} className="fav-card">
              <div className="fav-image-container">
                <Link to={`/product/${product._id}`}>
                  <img src={product.images && product.images[0]} alt={product.name} />
                </Link>
                <button className="remove-fav-btn" onClick={() => handleRemove(product)}>
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="fav-info">
                <div className="fav-header">
                  <h3>{product.name}</h3>
                  <span className="fav-price">Rs. {product.price}</span>
                </div>
                <p className="fav-category">{product.category.toUpperCase()}</p>
                
                <button className="move-to-cart-btn" onClick={() => addToCart(product)}>
                  <ShoppingBag size={18} /> Move to Bag
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setProductToRemove(null); }}
        onConfirm={() => {
          if (productToRemove) {
            toggleFavorite(productToRemove);
          }
          setIsModalOpen(false);
          setProductToRemove(null);
        }}
        title="Remove Favorite?"
        message="Are you sure you want to remove this item from your favorites?"
      />
    </div>
  );
};

export default Favorites;
