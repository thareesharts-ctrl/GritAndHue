import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'kids',
    tag: '',
    is_active: true
  });
  const [imageFiles, setImageFiles] = useState([]); // Multiple files
  const [imagePreviews, setImagePreviews] = useState([]); // Multiple previews
  const [selectedSizes, setSelectedSizes] = useState([]); // Selected sizes array

  const fetchProducts = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api/v1/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    // Reset sizes if category changes
    if (name === 'category') setSelectedSizes([]);
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Append newly selected files to currently stored files
    const combinedFiles = [...imageFiles, ...selectedFiles];
    
    if (combinedFiles.length > 5) {
      alert("You can only upload a maximum of 5 images.");
      return;
    }
    
    setImageFiles(combinedFiles);
    
    // Generate object URLs for the newly added files
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    
    // Append new previews to existing previews
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const triggerConfetti = () => {
    const colors = ['#ff0055', '#00ff66', '#0055ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
    for (let i = 0; i < 80; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-particle';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-20px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = Math.random() * 8 + 6 + 'px';
      confetti.style.height = Math.random() * 8 + 6 + 'px';
      if (Math.random() > 0.5) {
        confetti.style.borderRadius = '50%';
      }
      
      confetti.style.animationDuration = Math.random() * 2 + 1.5 + 's';
      confetti.style.animationDelay = Math.random() * 0.4 + 's';
      
      document.body.appendChild(confetti);
      
      setTimeout(() => {
        confetti.remove();
      }, 3500);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', category: 'kids', tag: '', is_active: true });
    setImageFiles([]);
    setImagePreviews([]);
    setSelectedSizes([]);
    setEditingProduct(null);
    setIsFormOpen(false);
    setMessage({ type: '', text: '' });
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      tag: product.tag || '',
      is_active: product.is_active
    });
    setSelectedSizes(product.sizes || []);
    setImagePreviews(product.images || []);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('tag', formData.tag);
    data.append('is_active', formData.is_active);
    
    // Append multiple images
    imageFiles.forEach(file => {
      data.append('images', file);
    });

    // Append multiple sizes
    selectedSizes.forEach(size => {
      data.append('sizes', size);
    });

    try {
      const token = sessionStorage.getItem('adminToken');
      const url = editingProduct 
        ? (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/api/v1/products/${editingProduct._id}`
        : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api/v1/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      
      const result = await response.json();
      if(response.ok) {
        setMessage({ type: 'success', text: `Product ${editingProduct ? 'updated' : 'published'} successfully!` });
        triggerConfetti();
        setTimeout(() => {
          resetForm();
          fetchProducts();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Ensure backend is running.' });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    
    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/api/v1/products/${deletingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setDeletingId(null);
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const filteredProducts = categoryFilter === 'all' 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-brand">
          <img src={`${siteUrl}/assets/Home page/logo.png`} alt="Grit and Hue" className="admin-logo" />
          <div className="admin-title-group">
            <h1>Dashboard</h1>
            <p>Product Catalog Manager</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="add-btn" onClick={() => setIsFormOpen(true)}>
            <Plus size={20} /> Add New Product
          </button>
          <button 
            className="logout-btn"
            onClick={() => { sessionStorage.removeItem('adminToken'); window.location.href = `${siteUrl}/login`; }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={categoryFilter === 'all' ? 'active' : ''} 
          onClick={() => setCategoryFilter('all')}
        >
          All ({products.length})
        </button>
        <button 
          className={categoryFilter === 'men' ? 'active' : ''} 
          onClick={() => setCategoryFilter('men')}
        >
          Men's Wear ({products.filter(p => p.category === 'men').length})
        </button>
        <button 
          className={categoryFilter === 'kids' ? 'active' : ''} 
          onClick={() => setCategoryFilter('kids')}
        >
          Kids Wear ({products.filter(p => p.category === 'kids').length})
        </button>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product._id} className="product-card">
            <div className="card-image">
              <img src={product.images && product.images[0]} alt={product.name} />
              {!product.is_active && <span className="inactive-badge">Hidden</span>}
            </div>
            <div className="card-content">
              <div className="card-top-row">
                <h3>{product.name}</h3>
                <span className="card-date">{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="card-category">{product.category.toUpperCase()}</p>
              <p className="card-price">₹{product.price}</p>
              <div className="card-actions">
                <button onClick={() => openEdit(product)} title="Edit"><Edit2 size={18} /></button>
                <button onClick={() => setDeletingId(product._id)} title="Delete" className="delete-btn"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={resetForm}><X size={24} /></button>
            </div>
            
            {message.text && (
              <div className={`admin-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="kids">Kids Wear</option>
                    <option value="men">Men's Wear</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-group">
                <label>Tag (e.g. New Arrival)</label>
                <input type="text" name="tag" value={formData.tag} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
              </div>

              <div className="form-group">
                <label>Available Sizes</label>
                <div className="size-selector-admin">
                  {(formData.category === 'kids' 
                    ? ['1-2 Yrs', '2-3 Yrs', '3-4 Yrs', '4-5 Yrs', '5-6 Yrs']
                    : ['M', 'L', 'XL', '2XL', '3XL']
                  ).map(size => (
                    <button
                      type="button"
                      key={size}
                      className={`size-chip ${selectedSizes.includes(size) ? 'active' : ''}`}
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Product Images (Max 5)</label>
                <div className="image-upload-wrapper multiple">
                  {imagePreviews.length > 0 ? (
                    <div className="multi-preview-grid">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="mini-preview">
                          <img src={src} alt="Preview" />
                        </div>
                      ))}
                      {imagePreviews.length < 5 && (
                        <label htmlFor="image-input" className="add-more-previews">
                          <Plus size={20} />
                        </label>
                      )}
                    </div>
                  ) : (
                    <label htmlFor="image-input" className="upload-placeholder">
                      <Upload size={32} />
                      <span>Click to upload up to 5 images</span>
                    </label>
                  )}
                  <input id="image-input" type="file" accept="image/*" multiple onChange={handleImageChange} hidden />
                </div>
                 {imagePreviews.length > 0 && (
                  <button 
                    type="button" 
                    className="change-all-btn" 
                    style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', display: 'block', margin: '10px auto 0 auto', fontWeight: 600, fontSize: '0.85rem' }}
                    onClick={() => {
                      setImageFiles([]);
                      setImagePreviews([]);
                    }}
                  >
                    Clear All Images
                  </button>
                )}
              </div>

              <div className="form-group checkbox-group">
                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                <label htmlFor="is_active">Show in public catalog</label>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Processing...' : (editingProduct ? 'Update Product' : 'Publish Product')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button onClick={() => setDeletingId(null)}><X size={24} /></button>
            </div>
            <p className="delete-warning">Are you sure you want to remove this product? This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDelete}>Yes, Delete Product</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay-container">
          <div className="loading-spinner-box">
            <div className="loading-spinner"></div>
            <h3>Uploading Product</h3>
            <p>Publishing details & uploading images securely...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
