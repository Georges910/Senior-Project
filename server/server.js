require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    console.warn(`⏱️ Request timeout: ${req.method} ${req.url}`);
    res.status(408).json({ error: 'Request timeout' });
  });
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

// Start server
app.listen(3000, '0.0.0.0', () => console.log('🚀 Server running on port 3000'));