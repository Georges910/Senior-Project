const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminCredential = require('../models/AdminCredential');



const router = express.Router();

// Admin Login (checks Ekklesia.admincredentials)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password, fullName, church } = req.body;
    // Support login by email or by fullName+church
    let admin;
    if (email) {
      admin = await AdminCredential.findOne({ fullName: email }); // fallback: treat email as fullName
    } else if (fullName && church) {
      admin = await AdminCredential.findOne({ fullName, church });
    }
    if (!admin) {
      return res.status(400).json({ error: 'Admin not found' });
    }
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    // Create JWT token
    const token = jwt.sign({ id: admin._id, fullName: admin.fullName, church: admin.church }, process.env.JWT_SECRET, { expiresIn: '2h' });
    // Return admin profile (excluding password)
    const adminProfile = { fullName: admin.fullName, church: admin.church, id: admin._id };
    return res.json({ message: 'Admin login successful', token, admin: adminProfile });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Admin login failed', details: err?.message || err });
  }
});


// Admin: Get all users
router.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, 'fullName parish email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Add Admin to ekklisia.admincredentials
router.post('/add-admin', async (req, res) => {
  try {
    const { fullName, password, church } = req.body;
    if (!fullName || !password || !church) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    // Check if admin with same name and church exists
    const existing = await AdminCredential.findOne({ fullName, church });
    if (existing) {
      return res.status(400).json({ error: 'Admin already exists for this church' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new AdminCredential({
      fullName,
      password: hashedPassword,
      church
    });
  await newAdmin.save();
  console.log(`Admin added: ${fullName} (${church})`);
  return res.json({ message: 'Admin added successfully' });
  } catch (err) {
    console.error('Add admin error:', err);
    // Always return JSON, even on error
    return res.status(500).json({ error: 'Failed to add admin', details: err?.message || err });
  }
});



// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, parish, email, password } = req.body;

    if (!fullName || !parish || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check for duplicate username (fullName)
    const existingName = await User.findOne({ fullName });
    if (existingName) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      parish,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.json({ message: 'User registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });



    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Email or password is invalid' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });

  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Profile route (requires authentication)
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("fullName parish email");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      fullName: user.fullName,
      parish: user.parish,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
