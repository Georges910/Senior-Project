
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// Import routes
const authRoutes = require('./routes/Authentication');

// Use routes
app.use('/api/auth', authRoutes);

// Gracefully close MongoDB connection on process exit
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});

// Start server
app.listen(3000, "0.0.0.0", () => console.log('🚀 Server running on port 3000'));
