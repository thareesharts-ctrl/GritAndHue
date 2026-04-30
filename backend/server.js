require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');
const https = require('https');
const cron = require('node-cron');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'daybyday_products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif', 'gif', 'heic', 'bmp'],
    transformation: [
      { width: 1000, height: 1333, crop: 'pad', background: 'white' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Handle DB disconnection
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB runtime error:', err);
});

// Mongoose Schemas & Models
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, enum: ['kids', 'men'], required: true },
  images: [{ type: String }],
  sizes: [{ type: String }],
  tag: { type: String },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  cart: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    selectedSize: { type: String }
  }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Auth Routes
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const newUser = new User({ name, email, password }); // In production, hash the password!
    await newUser.save();
    
    const token = jwt.sign({ id: newUser._id, role: 'user' }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
    res.status(201).json({ token, user: { name: newUser.name, email: newUser.email, role: 'user' } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check Admin first
    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
      return res.json({ token, role: 'admin' });
    }

    // Check Regular User
    const user = await User.findOne({ email });
    if (user && user.password === password) { // In production, use bcrypt compare!
      const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
      return res.json({ token, role: 'user', user: { name: user.name, email: user.email } });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Middleware
const verifyUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Session expired or unauthorized' });
    req.admin = decoded;
    next();
  });
};

// User Data Sync Routes
app.get('/api/v1/user/data', verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('cart._id')
      .populate('favorites');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Transform cart to match frontend expectations
    const formattedCart = user.cart
      .filter(item => item._id) 
      .map(item => ({
        ...item._id.toObject(),
        quantity: item.quantity,
        selectedSize: item.selectedSize
      }));

    res.json({
      cart: formattedCart,
      favorites: user.favorites.filter(f => f)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.post('/api/v1/user/sync', verifyUser, async (req, res) => {
  try {
    const { cart, favorites } = req.body;
    
    const dbCart = cart.map(item => ({
      _id: item._id,
      quantity: item.quantity,
      selectedSize: item.selectedSize
    }));

    const dbFavorites = favorites.map(f => f._id || f);

    await User.findByIdAndUpdate(req.userId, {
      cart: dbCart,
      favorites: dbFavorites
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync data' });
  }
});


// Routes
app.post('/api/v1/products', verifyAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, tag, sizes } = req.body;
    
    if(!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    const imageUrls = req.files.map(file => file.path); // Cloudinary secure URLs

    const newProduct = new Product({
      name,
      description,
      price: parseFloat(price),
      category: category || 'kids',
      images: imageUrls,
      sizes: Array.isArray(sizes) ? sizes : (sizes ? [sizes] : []),
      tag: tag || null
    });

    await newProduct.save();
    console.log('✅ Product saved:', newProduct.name);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Failed to upload product. Check database connection.' });
  }
});

// Update Product
app.put('/api/v1/products/:id', verifyAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, tag, is_active, sizes } = req.body;
    const updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      tag,
      sizes: Array.isArray(sizes) ? sizes : (sizes ? [sizes] : []),
      is_active: is_active === 'true' || is_active === true
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedProduct) return res.status(404).json({ error: 'Product not found' });
    
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete Product
app.delete('/api/v1/products/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.get('/api/v1/products', async (req, res) => {
  try {
    const { category, all } = req.query;
    
    // Check if requester is admin to show inactive products
    const authHeader = req.headers['authorization'];
    let isAdmin = false;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.role === 'admin') isAdmin = true;
      } catch (e) {}
    }

    let filter = {};
    if (category) filter.category = category;
    if (!isAdmin && all !== 'true') filter.is_active = true;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Grit and Hue Backend Running!' });
});

// --- DATABASE STORAGE MONITORING ---
const checkDatabaseStorage = async () => {
  try {
    // Get database stats
    const stats = await mongoose.connection.db.command({ dbStats: 1 });
    
    // We check storageSize (compressed) or dataSize depending on requirements
    const storageUsedMB = (stats.storageSize || stats.dataSize) / (1024 * 1024);
    
    console.log(`📊 DB Storage Check: ${storageUsedMB.toFixed(2)} MB / 512 MB`);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && botToken !== "GET_FROM_BOTFATHER" && chatId && chatId !== "GET_FROM_USERINFOBOT") {
      let message = "";
      if (storageUsedMB > 450) {
        message = `⚠️ *DATABASE STORAGE ALERT*\n\nYour MongoDB storage is at *${storageUsedMB.toFixed(2)} MB* / 512 MB.\n\nAction Required: Please clean up logs or old data!`;
      } else {
        message = `📊 *DATABASE INSIGHT*\n\nCurrent storage usage: *${storageUsedMB.toFixed(2)} MB* / 512 MB.\n\nSystem status: Healthy ✅`;
      }
      
      const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
      
      https.get(url, (res) => {
        console.log('✅ Telegram Storage Insight sent');
      }).on('error', (err) => {
        console.error('❌ Failed to send Telegram Insight:', err.message);
      });
    } else {
      console.warn('⚠️ Telegram Update skipped: Bot Token or Chat ID not configured');
    }
  } catch (err) {
    console.error('❌ Error during DB storage monitor:', err);
  }
};

// Check every day at 8:00 AM (Indian Standard Time)
cron.schedule('0 8 * * *', checkDatabaseStorage, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Also check on server start after a delay (just to ensure it works on restart)
setTimeout(checkDatabaseStorage, 10000); 


// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});
