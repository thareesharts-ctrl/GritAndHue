require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'daybyday_products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/daybyday_db';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Mongoose Schemas & Models
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, enum: ['kids', 'men'], required: true },
  image_url: { type: String },
  tag: { type: String },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Auth Routes
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@daybyday.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET_KEY || 'secret', { expiresIn: '24h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid admin credentials' });
});

// Middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET_KEY || 'secret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Session expired or unauthorized' });
    req.admin = decoded;
    next();
  });
};

// Routes
app.post('/api/v1/products', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, tag } = req.body;
    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary secure URL
    }

    const newProduct = new Product({
      name,
      description,
      price: parseFloat(price),
      category: category || 'kids',
      image_url: imageUrl,
      tag: tag || null
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/products', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category, is_active: true } : { is_active: true };
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Day By Day Javascript Backend Running with MongoDB!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
