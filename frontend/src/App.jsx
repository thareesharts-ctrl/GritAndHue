import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Kids from './pages/public/Kids';
import Men from './pages/public/Men';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ProductDetails from './pages/public/ProductDetails';
import Cart from './pages/public/Cart';
import Favorites from './pages/public/Favorites';
import './App.css';

function Home() {
  return (
    <main className="home-page-simple">
      <div className="home-content-simple">
        <h1>Welcome to Grit and Hue</h1>
        <p>Premium everyday fashion.</p>
        <div className="home-links-simple">
          <Link to="/kids" className="home-btn-black">Shop Kids Wear</Link>
          <Link to="/men" className="home-btn-white">Shop Men's Wear</Link>
        </div>
      </div>
    </main>
  );
}

function App() {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userData')) || null);
  const isInitialMount = useRef(true);

  // Persistence & Sync logic (keep this)
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('userToken');
      if (user && token) {
        try {
          const res = await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api/v1/user/data', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setCartItems(data.cart || []);
            setFavorites(data.favorites || []);
          }
        } catch (err) {
          console.error("Failed to fetch user data:", err);
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const syncToDB = async () => {
      const token = localStorage.getItem('userToken');
      if (user && token) {
        try {
          await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api/v1/user/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cart: cartItems, favorites: favorites })
          });
        } catch (err) {
          console.error("Failed to sync to DB:", err);
        }
      }
    };
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('favorites', JSON.stringify(favorites));
    const timeout = setTimeout(syncToDB, 500);
    return () => clearTimeout(timeout);
  }, [cartItems, favorites, user]);


  const toggleFavorite = (product) => {
    if (!user) { window.location.href = '/login'; return; }
    setFavorites(prev => {
      const isFav = prev.find(item => item._id === product._id);
      if (isFav) return prev.filter(item => item._id !== product._id);
      return [...prev, product];
    });
  };

  const addToCart = (product, size) => {
    if (!user) { window.location.href = '/login'; return; }
    setCartItems(prev => {
      const existing = prev.find(item => item._id === product._id && item.selectedSize === size);
      if (existing) {
        return prev.map(item => (item._id === product._id && item.selectedSize === size) ? { ...item, quantity: Math.min(item.quantity + 1, 30) } : item);
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
  };

  const removeFromCart = (id, size) => {
    setCartItems(prev => prev.filter(item => !(item._id === id && item.selectedSize === size)));
  };

  const updateQuantity = (id, size, delta) => {
    setCartItems(prev => prev.map(item => (item._id === id && item.selectedSize === size) ? { ...item, quantity: Math.max(1, Math.min(item.quantity + delta, 30)) } : item));
  };

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar 
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
          favCount={favorites.length}
          user={user}
          setUser={setUser}
          clearCart={() => { setCartItems([]); setFavorites([]); }}
        />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kids" element={<Kids addToCart={addToCart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
            <Route path="/men" element={<Men addToCart={addToCart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register setUser={setUser} />} />
            <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
            <Route path="/cart" element={<Cart cartItems={cartItems} removeFromCart={removeFromCart} updateQuantity={updateQuantity} />} />
            <Route path="/favorites" element={<Favorites favorites={favorites} toggleFavorite={toggleFavorite} addToCart={addToCart} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
