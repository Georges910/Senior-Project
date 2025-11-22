const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendResetEmail = require('../email');
const User = require('../models/User');
const AdminCredential = require('../models/AdminCredential');



const router = express.Router();

// email sending is handled by server/email.js which uses SMTP env vars

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
    
    // Return profile data with token to avoid extra API call
    res.json({ 
      message: 'Login successful', 
      token,
      user: {
        fullName: user.fullName,
        parish: user.parish,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot password: generate a token and email it (or return token in dev)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Respond success to avoid account enumeration
      return res.json({ message: 'If an account with that email exists, a reset email has been sent' });
    }

    // generate token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:19006'}/reset-password/${token}`;

    // Try to send using centralized email helper
    try {
      await sendResetEmail(email, token, email);
      return res.json({ message: 'If an account with that email exists, a reset email has been sent' });
    } catch (mailErr) {
      console.error('[UserAuth] sendMail failed:', mailErr);
      // In development return the token so developer can continue testing
      if (process.env.NODE_ENV !== 'production') {
        const payload = { message: 'Reset token generated (email send failed)', token };
        return res.json(payload);
      }
      return res.status(500).json({ error: 'Failed to send reset email' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process forgot password' });
  }
});

// Reset password: accept token + newPassword
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body || {};
    if (!token || !email || !newPassword) return res.status(400).json({ error: 'token, email and newPassword required' });

    const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    // update password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify reset token and return associated email (used by frontend to prefill email)
router.get('/verify-reset', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) return res.status(400).json({ error: 'token is required' });

    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    return res.json({ email: user.email });
  } catch (err) {
    console.error('Verify reset token error:', err);
    return res.status(500).json({ error: 'Failed to verify token' });
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
