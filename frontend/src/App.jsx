import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Kids from './pages/public/Kids';
import Men from './pages/public/Men';


function Home() {
  return (
    <main style={{ padding: '4rem', textAlign: 'center', fontFamily: 'Inter' }}>
      <h1>Welcome to Day By Day</h1>
      <p>Premium everyday fashion.</p>
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link to="/kids" style={{ padding: '1rem 2rem', background: '#111', color: 'white', textDecoration: 'none', borderRadius: '30px', fontWeight: 'bold' }}>Shop Kids Wear</Link>
        <Link to="/men" style={{ padding: '1rem 2rem', background: '#fff', border: '1px solid #111', color: '#111', textDecoration: 'none', borderRadius: '30px', fontWeight: 'bold' }}>Shop Men's Wear</Link>

      </div>
    </main>
  );
}

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kids" element={<Kids />} />
          <Route path="/men" element={<Men />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
