import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, MapPin, User, Phone, Mail, Edit, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../components/common/ConfirmModal';
import './Cart.css';

const Cart = ({ cartItems, removeFromCart, updateQuantity, user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [step, setStep] = useState('cart'); // 'cart' or 'checkout'

  // Addresses API States
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [formData, setFormData] = useState({
    name: '', // label tag like Home, Work
    phone: '',
    email: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchAddresses = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    setLoadingAddresses(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api/v1/user/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        if (data.length > 0) {
          // Default to first address or preserve previous selection if it still exists
          setSelectedAddressId(prev => {
            const exists = data.some(addr => addr.id === prev);
            return exists ? prev : data[0].id;
          });
          setIsAddingNew(false);
        } else {
          setIsAddingNew(true); // Auto-open form if no addresses
        }
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (step === 'checkout' && user) {
      fetchAddresses();
    }
  }, [step, user]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 1000 ? 0 : 100;
  const total = subtotal + shipping;
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleRemove = (id, size) => {
    setItemToRemove({ id, size });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Label (e.g. Home, Work) is required';
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (formData.email?.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.street.trim()) errors.street = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.zipCode.trim()) {
      errors.zipCode = 'ZIP / PIN Code is required';
    } else if (!/^[0-9a-zA-Z\s-]{5,10}$/.test(formData.zipCode.trim())) {
      errors.zipCode = 'Please enter a valid ZIP/PIN code';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErrorEl = document.querySelector('.has-error');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const token = localStorage.getItem('userToken');
    if (!token) return;

    try {
      const isEditing = !!editingAddress;
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/user/addresses/${editingAddress.id}`
        : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/user/addresses`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const savedAddr = await res.json();
        setIsAddingNew(false);
        setEditingAddress(null);
        setFormData({
          name: '',
          phone: '',
          email: '',
          street: '',
          apartment: '',
          city: '',
          state: '',
          zipCode: ''
        });
        
        // Refresh address list and select the saved address
        await fetchAddresses();
        setSelectedAddressId(savedAddr.id);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to save address');
      }
    } catch (err) {
      console.error("Error saving address:", err);
      alert('Network error. Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    const token = localStorage.getItem('userToken');
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/user/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        await fetchAddresses();
      } else {
        alert('Failed to delete address');
      }
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const handleStartEdit = (addr) => {
    setEditingAddress(addr);
    setIsAddingNew(false);
    setFormData({
      name: addr.name,
      phone: addr.phone,
      email: addr.email || '',
      street: addr.street,
      apartment: addr.apartment || '',
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode
    });
    setFormErrors({});
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingAddress(null);
    setFormData({
      name: '',
      phone: '',
      email: user?.email || '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setFormErrors({});
  };

  const handleCancelForm = () => {
    setIsAddingNew(false);
    setEditingAddress(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setFormErrors({});
    
    // If no addresses left, go back to cart step
    if (addresses.length === 0) {
      setStep('cart');
    }
  };

  const handleWhatsAppOrder = () => {
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    
    if (!selectedAddress) {
      alert("Please select or add a delivery address first.");
      return;
    }

    let message = `🛍️ *Grit & Hue - New Order*\n\n`;
    
    message += `--- *Customer Details* ---\n`;
    message += `👤 *Name:* ${selectedAddress.name.toUpperCase()}\n`;
    message += `📞 *Phone:* ${selectedAddress.phone}\n`;
    if (selectedAddress.email) {
      message += `📧 *Email:* ${selectedAddress.email}\n`;
    }
    
    let addressStr = `${selectedAddress.street}`;
    if (selectedAddress.apartment) {
      addressStr += `, ${selectedAddress.apartment}`;
    }
    addressStr += `, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.zipCode}`;
    
    message += `📍 *Address:* ${addressStr}\n\n`;
    
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
        <h1 className="cart-title">
          {step === 'cart' ? `Your Bag (${totalQuantity})` : 'Checkout Details'}
        </h1>

        <div className="cart-layout">
          {/* Left Column: Switch between Items and Address Form */}
          {step === 'cart' ? (
            <div className="cart-items-section">
              {cartItems.map((item, index) => (
                <div key={`${item._id}-${item.selectedSize}-${index}`} className="cart-item">
                  <div className="item-image">
                    <img src={item.images && item.images[0]} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      <button className="remove-btn" onClick={() => handleRemove(item._id, item.selectedSize)}>
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
          ) : (
            <div className="checkout-details-section">
              <button className="back-to-cart-btn" onClick={() => setStep('cart')}>
                <ArrowLeft size={18} /> Back to Bag
              </button>
              
              {isAddingNew || editingAddress ? (
                <div className="checkout-card">
                  <h2>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
                  <form className="checkout-form" onSubmit={handleSaveAddress}>
                    <div className="form-section-title">Address Label & Contact</div>
                    
                    <div className="form-group-row two-cols">
                      <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
                        <label htmlFor="name">Address Label (e.g. Home, Work) *</label>
                        <div className="input-with-icon">
                          <User size={18} className="input-icon" />
                          <input 
                            type="text" 
                            id="name"
                            name="name" 
                            value={formData.name} 
                            onChange={handleInputChange} 
                            placeholder="e.g. Home, Office, Jane's House"
                            required 
                          />
                        </div>
                        {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                      </div>

                      <div className={`form-group ${formErrors.phone ? 'has-error' : ''}`}>
                        <label htmlFor="phone">Contact Phone Number *</label>
                        <div className="input-with-icon">
                          <Phone size={18} className="input-icon" />
                          <input 
                            type="tel" 
                            id="phone"
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleInputChange} 
                            placeholder="e.g. 9876543210"
                            required 
                          />
                        </div>
                        {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                      </div>
                    </div>

                    <div className="form-group-row">
                      <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
                        <label htmlFor="email">Contact Email (Optional)</label>
                        <div className="input-with-icon">
                          <Mail size={18} className="input-icon" />
                          <input 
                            type="email" 
                            id="email"
                            name="email" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            placeholder="name@example.com"
                          />
                        </div>
                        {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                      </div>
                    </div>

                    <div className="form-section-title">Shipping Address</div>
                    
                    <div className="form-group-row">
                      <div className={`form-group ${formErrors.street ? 'has-error' : ''}`}>
                        <label htmlFor="street">Street Address / House No / Area *</label>
                        <div className="input-with-icon">
                          <MapPin size={18} className="input-icon" />
                          <input 
                            type="text" 
                            id="street"
                            name="street" 
                            value={formData.street} 
                            onChange={handleInputChange} 
                            placeholder="House/Flat No, Building, Street name"
                            required 
                          />
                        </div>
                        {formErrors.street && <span className="error-message">{formErrors.street}</span>}
                      </div>
                    </div>

                    <div className="form-group-row">
                      <div className="form-group">
                        <label htmlFor="apartment">Apartment, Suite, Landmark (Optional)</label>
                        <input 
                          type="text" 
                          id="apartment"
                          name="apartment" 
                          value={formData.apartment} 
                          onChange={handleInputChange} 
                          placeholder="e.g. Near Central Mall, 3rd Floor"
                        />
                      </div>
                    </div>

                    <div className="form-group-row three-cols">
                      <div className={`form-group ${formErrors.city ? 'has-error' : ''}`}>
                        <label htmlFor="city">City *</label>
                        <input 
                          type="text" 
                          id="city"
                          name="city" 
                          value={formData.city} 
                          onChange={handleInputChange} 
                          placeholder="e.g. Chennai"
                          required 
                        />
                        {formErrors.city && <span className="error-message">{formErrors.city}</span>}
                      </div>

                      <div className={`form-group ${formErrors.state ? 'has-error' : ''}`}>
                        <label htmlFor="state">State *</label>
                        <input 
                          type="text" 
                          id="state"
                          name="state" 
                          value={formData.state} 
                          onChange={handleInputChange} 
                          placeholder="e.g. Tamil Nadu"
                          required 
                        />
                        {formErrors.state && <span className="error-message">{formErrors.state}</span>}
                      </div>

                      <div className={`form-group ${formErrors.zipCode ? 'has-error' : ''}`}>
                        <label htmlFor="zipCode">ZIP / PIN Code *</label>
                        <input 
                          type="text" 
                          id="zipCode"
                          name="zipCode" 
                          value={formData.zipCode} 
                          onChange={handleInputChange} 
                          placeholder="e.g. 600001"
                          required 
                        />
                        {formErrors.zipCode && <span className="error-message">{formErrors.zipCode}</span>}
                      </div>
                    </div>

                    <div className="form-actions-row">
                      <button type="submit" className="save-address-btn">
                        {editingAddress ? 'Update Address' : 'Save Address'}
                      </button>
                      <button type="button" className="cancel-address-btn" onClick={handleCancelForm}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="checkout-card">
                  <div className="addresses-header">
                    <h2>Select Delivery Address</h2>
                    <button className="add-address-btn" onClick={handleStartAdd}>
                      <Plus size={16} /> Add Address
                    </button>
                  </div>

                  {loadingAddresses ? (
                    <div className="address-loader">Loading addresses...</div>
                  ) : addresses.length === 0 ? (
                    <div className="no-address-state">
                      <p>You have no saved addresses. Please add one to continue.</p>
                    </div>
                  ) : (
                    <div className="addresses-list">
                      {addresses.map((addr) => (
                        <div 
                          key={addr.id} 
                          className={`address-card ${selectedAddressId === addr.id ? 'active' : ''}`}
                          onClick={() => setSelectedAddressId(addr.id)}
                        >
                          <div className="address-card-header">
                            <div className="address-label-badge">{addr.name.toUpperCase()}</div>
                            <div className="address-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="address-action-btn edit" onClick={() => handleStartEdit(addr)} title="Edit address">
                                <Edit size={16} />
                              </button>
                              <button className="address-action-btn delete" onClick={() => handleDeleteAddress(addr.id)} title="Delete address">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="address-card-body">
                            <p className="address-phone"><strong>Phone:</strong> {addr.phone}</p>
                            {addr.email && <p className="address-email"><strong>Email:</strong> {addr.email}</p>}
                            <p className="address-text">
                              {addr.street}
                              {addr.apartment ? `, ${addr.apartment}` : ''}
                              <br />
                              {addr.city}, {addr.state} - {addr.zipCode}
                            </p>
                          </div>
                          
                          {selectedAddressId === addr.id && (
                            <span className="selected-checkmark">
                              <Check size={20} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right Column: Order Summary (Sticky) */}
          <div className="cart-summary-section">
            <div className="summary-card">
              <h2>Order Summary</h2>
              
              {/* Condensed Items List in Checkout Step */}
              {step === 'checkout' && (
                <div className="checkout-items-summary">
                  <h3>Items in Order</h3>
                  <div className="checkout-items-list-scroll">
                    {cartItems.map((item, index) => (
                      <div key={`summary-${item._id}-${item.selectedSize}-${index}`} className="checkout-item-summary-row">
                        <img src={item.images && item.images[0]} alt={item.name} className="summary-item-thumb" />
                        <div className="summary-item-details">
                          <span className="summary-item-name">{item.name}</span>
                          <span className="summary-item-meta">Size: {item.selectedSize} | Qty: {item.quantity}</span>
                        </div>
                        <span className="summary-item-price">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="summary-divider"></div>
                </div>
              )}

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

              {step === 'cart' ? (
                <button className="order-btn" onClick={() => setStep('checkout')}>
                  ORDER NOW <ArrowRight size={20} />
                </button>
              ) : (
                <button 
                  className="order-btn" 
                  onClick={handleWhatsAppOrder} 
                  disabled={!selectedAddressId || isAddingNew || !!editingAddress}
                >
                  PLACE ORDER ON WHATSAPP <ArrowRight size={20} />
                </button>
              )}

              {step === 'checkout' && (
                <button className="edit-bag-link-btn" onClick={() => setStep('cart')}>
                  Edit Bag Items
                </button>
              )}

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
      
      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setItemToRemove(null); }}
        onConfirm={() => {
          if (itemToRemove) {
            removeFromCart(itemToRemove.id, itemToRemove.size);
          }
          setIsModalOpen(false);
          setItemToRemove(null);
        }}
        title="Remove Item?"
        message="Are you sure you want to remove this item from your bag?"
      />
    </div>
  );
};

export default Cart;
