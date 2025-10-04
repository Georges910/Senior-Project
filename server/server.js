
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/auth', require('./routes/Authentication'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// Import routes
const authRoutes = require('./routes/Authentication');
const bookRoutes = require("./routes/Book");
const churchRoutes = require('./routes/Church');

// Use routes
app.use('/api/auth', authRoutes);
app.use("/api/books", bookRoutes);
app.use('/api/church', churchRoutes);

// Gracefully close MongoDB connection on process exit
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});

// Catch-all error handler to always return JSON
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(3000, "0.0.0.0", () => console.log('🚀 Server running on port 3000'));
