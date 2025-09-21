const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Church = require('../models/Church');
const ChurchsCredential = require('../models/ChurchsCredential');
const AdminCredential = require('../models/AdminCredential');

// Middleware to authenticate admin via JWT
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, admin) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.admin = admin;
    next();
  });
}

// POST /api/church/ekklesia - add a new church to churchscredentials
router.post('/ekklesia', async (req, res) => {
  try {
    const { name, location, about, admins } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Church name is required' });
    }
    // Check for duplicate
    const existing = await ChurchsCredential.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: 'Church already exists' });
    }
    const newChurch = new ChurchsCredential({ name: name.trim(), location, about, admins: admins || [] });
    await newChurch.save();
    return res.json({ message: 'Church added successfully', church: newChurch });
  } catch (err) {
    console.error('Add ekklesia church error:', err);
    return res.status(500).json({ error: 'Failed to add church', details: err?.message || err });
  }
});

// GET /api/church/ekklesia - get all churches from churchscredentials
router.get('/ekklesia', async (req, res) => {
  try {
    const churches = await ChurchsCredential.find({});
    return res.json({ churches });
  } catch (err) {
    console.error('Fetch ekklesia churches error:', err);
    return res.status(500).json({ error: 'Failed to fetch ekklesia churches', details: err?.message || err });
  }
});

// GET /api/church/credentials - get all churches from admincredentials
router.get('/credentials', async (req, res) => {
  try {
    // Get all unique church names from admincredentials
    const churches = await AdminCredential.find({}, 'church').lean();
    // Extract unique names
    const uniqueChurches = [...new Set(churches.map(c => c.church))];
    return res.json({ churches: uniqueChurches });
  } catch (err) {
    console.error('Fetch credential churches error:', err);
    return res.status(500).json({ error: 'Failed to fetch credential churches', details: err?.message || err });
  }
});

// GET /api/church/all - get all churches in the database
router.get('/all', async (req, res) => {
  try {
    const churches = await Church.find({});
    return res.json({ churches });
  } catch (err) {
    console.error('Fetch all churches error:', err);
    return res.status(500).json({ error: 'Failed to fetch churches', details: err?.message || err });
  }
});

// Add a new church by name
router.post('/add', async (req, res) => {
  try {
    console.log('BODY:', req.body);
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body is missing or invalid' });
    }
    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Church name is required' });
    }
    // Check for duplicate
    const existing = await Church.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: 'Church already exists' });
    }
    const newChurch = new Church({ name: name.trim() });
    await newChurch.save();
    return res.json({ message: 'Church added successfully', church: newChurch });
  } catch (err) {
    console.error('Add church error:', err);
    return res.status(500).json({ error: 'Failed to add church', details: err?.message || err });
  }
});

// GET /api/church/assigned - get churches assigned to this admin and matching church name
router.get('/assigned', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const churchName = req.admin && req.admin.church;
    if (!adminId || !churchName) return res.status(401).json({ error: 'Unauthorized' });
    // Find churches where this admin is assigned and name matches
    const churches = await Church.find({
      admins: adminId,
      name: churchName
    });
    return res.json({ churches });
  } catch (err) {
    console.error('Fetch assigned churches error:', err);
    return res.status(500).json({ error: 'Failed to fetch assigned churches', details: err?.message || err });
  }
});

// PATCH /api/church/:id/info
router.patch('/:id/info', authenticateAdmin, async (req, res) => {
  try {
    const churchId = req.params.id;
    const adminId = req.admin && req.admin.id;
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

    // Find church and check if admin is assigned
    const church = await Church.findById(churchId);
    if (!church) return res.status(404).json({ error: 'Church not found' });
    if (!church.admins.map(a => a.toString()).includes(adminId)) {
      return res.status(403).json({ error: 'You are not assigned to this church' });
    }

    // Update allowed fields
    const allowed = ['location', 'about', 'number', 'facebook', 'email'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        church[key] = req.body[key];
      }
    }
    await church.save();
    return res.json({ message: 'Church info updated', church });
  } catch (err) {
    console.error('Update church info error:', err);
    return res.status(500).json({ error: 'Failed to update church info', details: err?.message || err });
  }
});

module.exports = router;
