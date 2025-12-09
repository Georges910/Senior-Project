require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const os = require('os');
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// Security & Performance Middleware (apply early)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow image loading
}));
app.use(compression()); // Gzip compression for all responses

// CORS - configure properly for production
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Set to your domain in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files with caching
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: '1d', // Cache uploads for 1 day
  etag: true,
}));

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    console.warn(`⏱️ Request timeout: ${req.method} ${req.url}`);
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Simple request logger to help debug connectivity from devices
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`➡️  [${now}] ${req.ip} ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to MongoDB with optimized settings
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10, // Maximum number of connections in the pool (default: 100, reduced for better resource management)
  minPoolSize: 2,  // Minimum number of connections to maintain
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Enable query logging in development (helps identify slow queries)
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`🔍 ${collectionName}.${method}`, JSON.stringify(query));
  });
}

// Import routes
const authRoutes = require('./routes/Authentication');
const bookRoutes = require('./routes/Book');
const churchRoutes = require('./routes/Church');
const eventRoutes = require('./routes/Events');
const userLikesRoutes = require('./routes/UserLikes');
const recommendationsRoutes = require('./routes/Recommendations');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/church', churchRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/user', userLikesRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed gracefully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));  // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kill command
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

// Monitor MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Health check endpoint used to verify server reachability from phones
app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'production', time: Date.now() });
});

// Start server (listen on all interfaces by default)
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  // Log basic startup info and local IPv4 addresses to help mobile testing
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  const nets = os.networkInterfaces();
  const addresses = [];
  Object.keys(nets).forEach((name) => {
    for (const net of nets[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4
      if (net.family === 'IPv4' && !net.internal) addresses.push(net.address);
    }
  });
  if (addresses.length) {
    console.log('📶 Local IPs:', addresses.join(', '));
  } else {
    console.log('📶 No non-internal IPv4 addresses found');
  }
});