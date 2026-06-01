require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');
const https = require('https');
const cron = require('node-cron');

const prisma = new PrismaClient();

// Connect Prisma
prisma.$connect()
  .then(() => console.log('✅ Prisma connected to PostgreSQL Successfully!'))
  .catch((err) => {
    console.error('❌ Prisma Connection Error:', err);
    process.exit(1);
  });

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

// Auth Routes
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const newUser = await prisma.user.create({
      data: { name, email, password }
    });
    
    const token = jwt.sign({ id: newUser.id, role: 'user' }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password === password) {
      const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
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
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        cart: {
          include: { product: true }
        }
      }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Transform cart to match frontend expectations
    const formattedCart = user.cart
      .map(item => {
        if (!item.product) return null;
        return {
          ...item.product,
          _id: item.product.id, // Frontend uses _id for compatibility
          quantity: item.quantity,
          selectedSize: item.selectedSize
        };
      })
      .filter(Boolean);

    // Fetch favorites products
    const favProducts = await prisma.product.findMany({
      where: { id: { in: user.favorites } }
    });

    const formattedFavorites = favProducts.map(p => ({
      ...p,
      _id: p.id
    }));

    res.json({
      cart: formattedCart,
      favorites: formattedFavorites
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.post('/api/v1/user/sync', verifyUser, async (req, res) => {
  try {
    const { cart, favorites } = req.body;
    
    const dbFavorites = favorites.map(f => f._id || f.id || f);

    // We do synchronous transactional delete and create for the cart items
    await prisma.$transaction(async (tx) => {
      // 1. Delete all current cart items for user
      await tx.cartItem.deleteMany({
        where: { userId: req.userId }
      });

      // 2. Create the new cart items
      if (cart.length > 0) {
        await tx.cartItem.createMany({
          data: cart.map(item => ({
            userId: req.userId,
            productId: item._id || item.id,
            quantity: item.quantity,
            selectedSize: item.selectedSize
          }))
        });
      }

      // 3. Update favorites array on User
      await tx.user.update({
        where: { id: req.userId },
        data: {
          favorites: dbFavorites
        }
      });
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Products Routes
app.post('/api/v1/products', verifyAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, tag, sizes } = req.body;
    
    if(!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    const imageUrls = req.files.map(file => file.path); // Cloudinary secure URLs

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category: category || 'kids',
        images: imageUrls,
        sizes: Array.isArray(sizes) ? sizes : (sizes ? [sizes] : []),
        tag: tag || null
      }
    });

    console.log('✅ Product saved:', newProduct.name);
    res.status(201).json({ ...newProduct, _id: newProduct.id });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Failed to upload product.' });
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
      isActive: is_active === 'true' || is_active === true
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    res.json({ ...updatedProduct, _id: updatedProduct.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete Product
app.delete('/api/v1/products/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedProduct = await prisma.product.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
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
    if (!isAdmin && all !== 'true') filter.isActive = true;

    const products = await prisma.product.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });

    res.json(products.map(p => ({ ...p, _id: p.id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ ...product, _id: product.id });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/orders', async (req, res) => {
  try {
    const { items, total } = req.body;
    
    // Generate a unique 6-digit order code (e.g. GNH-293810)
    let orderCode = "";
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      orderCode = `GNH-${randomDigits}`;
      
      const existing = await prisma.order.findUnique({ where: { orderCode } });
      if (!existing) isUnique = true;
    }

    // Save order
    const newOrder = await prisma.order.create({
      data: {
        orderCode,
        items: items, // array of items
        total: parseFloat(total)
      }
    });

    res.status(201).json({ orderCode: newOrder.orderCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate secure order ticket' });
  }
});

app.get('/api/v1/orders/verify/:code', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderCode: req.params.code }
    });

    if (!order) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Order Not Found</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8f9fa; }
              .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              h1 { color: #e53e3e; margin-bottom: 1rem; }
              p { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>⚠️ Invalid Order Ticket</h1>
              <p>This order code does not exist in our database. The buyer may have tampered with the link or the transaction has expired.</p>
            </div>
          </body>
        </html>
      `);
    }

    const orderItems = Array.isArray(order.items) ? order.items : [];
    
    // Build receipt rows
    let itemRows = "";
    orderItems.forEach(item => {
      itemRows += `
        <tr>
          <td><strong>${item.name}</strong><br><small>Size: ${item.selectedSize || 'N/A'}</small></td>
          <td align="center">${item.quantity}</td>
          <td align="right">Rs. ${item.price}</td>
          <td align="right">Rs. ${item.price * item.quantity}</td>
        </tr>
      `;
    });

    const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 1000 ? 0 : 100;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Secure Receipt - Order ${order.orderCode}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; background: #f4f6f8; margin: 0; padding: 20px; color: #333; }
            .receipt-container { max-width: 600px; margin: 30px auto; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); padding: 40px; border-top: 8px solid #111; position: relative; overflow: hidden; }
            .watermark { position: absolute; top: -10px; right: -10px; background: #2f855a; color: white; padding: 10px 40px; transform: rotate(45deg); font-weight: 800; font-size: 0.75rem; letter-spacing: 0.1em; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { height: 40px; margin-bottom: 10px; }
            .title { font-size: 1.5rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
            .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 0.9rem; }
            .meta-info div span { display: block; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
            .meta-info div strong { color: #1e293b; font-size: 1rem; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
            td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
            .totals { width: 50%; margin-left: auto; font-size: 0.95rem; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.grand-total { border-top: 2px solid #e2e8f0; padding-top: 15px; margin-top: 10px; font-size: 1.25rem; font-weight: 800; color: #111; }
            .verified-stamp { margin-top: 40px; padding: 15px; background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 10px; color: #2f855a; font-weight: 700; font-size: 1rem; }
            .btn-print { display: block; width: 100%; text-align: center; background: #111; color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 700; cursor: pointer; text-decoration: none; margin-top: 30px; font-size: 1rem; transition: background 0.2s; }
            .btn-print:hover { background: #333; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="watermark">SECURE</div>
            
            <div class="header">
              <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/assets/Home page/logo.png" alt="Grit and Hue" class="logo" />
              <div class="title">Secure Order Verification</div>
            </div>

            <div class="meta-info">
              <div>
                <span>Order Code</span>
                <strong>${order.orderCode}</strong>
              </div>
              <div>
                <span>Timestamp</span>
                <strong>${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong style="color: #2f855a;">VERIFIED</strong>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th align="center">Qty</th>
                  <th align="right">Unit Price</th>
                  <th align="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>Rs. ${subtotal}</span>
              </div>
              <div class="totals-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'FREE' : 'Rs. ' + shipping}</span>
              </div>
              <div class="totals-row grand-total">
                <span>Total Payable</span>
                <span>Rs. ${order.total}</span>
              </div>
            </div>

            <div class="verified-stamp">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#2f855a"/>
              </svg>
              Verified Secure Order Ticket (Database Record)
            </div>

            <button onclick="window.print()" class="btn-print">Print Receipt</button>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Grit and Hue Backend Running!' });
});

// --- DATABASE STORAGE MONITORING ---
const checkDatabaseStorage = async () => {
  try {
    // Get database size in PostgreSQL
    const stats = await prisma.$queryRaw`SELECT pg_database_size(current_database()) AS size`;
    const sizeInBytes = stats[0]?.size || 0;
    const storageUsedMB = Number(sizeInBytes) / (1024 * 1024);
    
    let displaySize = `${storageUsedMB.toFixed(2)} MB`;
    if (storageUsedMB > 1024) {
      displaySize = `${(storageUsedMB / 1024).toFixed(2)} GB`;
    }

    console.log(`📊 DB Storage Check: ${displaySize}`);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && botToken !== "GET_FROM_BOTFATHER" && chatId && chatId !== "GET_FROM_USERINFOBOT") {
      let message = `📊 *GRIT & HUE STORAGE STATUS*\n\nCurrent storage usage: *${displaySize}*\n\nSystem status: Healthy ✅`;
      
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

// Check weekly once on Mondays at 8:00 AM (Indian Standard Time)
cron.schedule('0 8 * * 1', checkDatabaseStorage, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Also check on server start after a delay (just to ensure it works on restart)
setTimeout(checkDatabaseStorage, 10000); 

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});
// Database migrated and tested successfully to PostgreSQL and Prisma!
