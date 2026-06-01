import React from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Cart.css';

const Cart = ({ cartItems, removeFromCart, updateQuantity }) => {
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 1000 ? 0 : 100;
  const total = subtotal + shipping;

  const handleWhatsAppOrder = () => {
    let message = `🛍️ *Grit & Hue - New Order*\n\n`;
    message += `--- *Order Details* ---\n`;
    
    cartItems.forEach(item => {
      const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
      const productLink = `${siteUrl}/product/${item._id || item.id}`;
      message += `• *${item.name}*\n  Size: ${item.selectedSize || 'N/A'}\n  Qty: ${item.quantity}\n  Price: Rs. ${item.price * item.quantity}\n  Product Link: ${productLink}\n\n`;
    });

    message += `*Subtotal:* Rs. ${subtotal}\n`;
    message += `*Shipping:* ${shipping === 0 ? 'FREE' : 'Rs. ' + shipping}\n`;
    message += `*Total Payable:* Rs. ${total}\n\n`;
    message += `Please confirm my order details!`;

    const whatsappUrl = `https://wa.me/9655673073?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart-page">
        <div className="empty-cart-content">
          <ShoppingBag size={80} strokeWidth={1} />
          <h2>Your bag is empty</h2>
          <p>Looks like you haven't added anything to your bag yet.</p>
          <Link to="/men" className="shop-now-btn">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-title">Your Bag ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</h1>

        <div className="cart-layout">
          {/* Left: Items List */}
          <div className="cart-items-section">
            {cartItems.map((item, index) => (
              <div key={`${item._id}-${item.selectedSize}-${index}`} className="cart-item">
                <div className="item-image">
                  <img src={item.images && item.images[0]} alt={item.name} />
                </div>
                <div className="item-details">
                  <div className="item-header">
                    <h3>{item.name}</h3>
                    <button className="remove-btn" onClick={() => removeFromCart(item._id, item.selectedSize)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="item-info-row">
                    <p className="item-category">{item.category.toUpperCase()} WEAR</p>
                    {item.selectedSize && <span className="item-size-badge">Size: {item.selectedSize}</span>}
                  </div>
                  
                  <div className="item-footer">
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item._id, item.selectedSize, -1)} disabled={item.quantity <= 1}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.selectedSize, 1)} disabled={item.quantity >= 30}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="item-total-price">Rs. {item.price * item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Summary */}
          <div className="cart-summary-section">
            <div className="summary-card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'free-shipping' : ''}>
                  {shipping === 0 ? 'FREE' : `Rs. ${shipping}`}
                </span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>
              
              <p className="gst-notice">Prices include all applicable taxes (GST).</p>

              <button className="order-btn" onClick={handleWhatsAppOrder}>
                ORDER NOW <ArrowRight size={20} />
              </button>

              <div className="payment-trust">
                <p>Order processed securely via WhatsApp</p>
                <div className="trust-icons">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
