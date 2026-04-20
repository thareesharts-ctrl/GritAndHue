import React, { useState } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'kids',
    tag: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
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
    if (formData.tag) data.append('tag', formData.tag);
    if (imageFile) {
      data.append('image', imageFile);
    } else {
      setMessage({ type: 'error', text: 'Please select an image.' });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/api/v1/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data // Sending FormData for multer
      });
      
      const result = await response.json();
      if(response.ok) {
        setMessage({ type: 'success', text: 'Product published successfully!' });
        setFormData({ name: '', description: '', price: '', category: 'kids', tag: '' });
        setImageFile(null);
        e.target.reset(); // Reset file input
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add product' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Ensure backend is running.' });
    }
    setLoading(false);
  };

  return (
    <div className="admin-page">
      <div className="admin-container" style={{ position: 'relative' }}>
        <button 
          onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/admin-login'; }}
          style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Logout
        </button>
        <h2>Admin Panel</h2>
        <p className="admin-subtitle">Publish a new product to your catalog.</p>
        
        {message.text && (
          <div className={`admin-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Premium Cotton Shirt" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e0e0e0', outline: 'none' }}>
                <option value="kids">Kids Wear</option>
                <option value="men">Men's Wear</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tag (Optional)</label>
              <input type="text" name="tag" value={formData.tag} onChange={handleInputChange} placeholder="e.g. Bestseller, New" />
            </div>
          </div>

          <div className="form-group">
            <label>Price (₹)</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required placeholder="0" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Describe the item..." />
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <div className="file-upload">
              <input type="file" name="image" accept="image/*" onChange={handleImageChange} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Uploading safely to Cloudinary...' : 'Publish Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
