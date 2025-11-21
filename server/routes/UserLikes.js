const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// POST /api/user/likes  body: { eventId, action: 'like'|'unlike' }
router.post('/likes', authenticate, async (req, res) => {
  try {
    // support either `eventId` or legacy `itemId`
    const { eventId: bodyEventId, itemId, action = 'like' } = req.body || {};
    const eventId = bodyEventId || itemId;
    console.log('[UserLikes] POST payload:', { userId: req.user?.id, eventId, action });
    if (!eventId) return res.status(400).json({ error: 'eventId (or itemId) required' });
    if (!mongoose.isValidObjectId(eventId)) return res.status(400).json({ error: 'eventId must be a valid ObjectId' });

    const uid = req.user.id;
    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const asObjectId = new mongoose.Types.ObjectId(eventId);
    const exists = (user.likedEvents || []).some(id => String(id) === String(asObjectId));

    if (action === 'like') {
      if (!exists) user.likedEvents.push(asObjectId);
    } else if (action === 'unlike') {
      if (exists) user.likedEvents = (user.likedEvents || []).filter(id => String(id) !== String(asObjectId));
    }

    await user.save();
    return res.json({ success: true, likedEvents: (user.likedEvents || []).map(id => String(id)) });
  } catch (err) {
    console.error('User likes error:', err);
    const payload = { error: 'Failed to update likes' };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = err?.message || String(err);
      payload.stack = err?.stack;
    }
    return res.status(500).json(payload);
  }
});

// GET /api/user/likes  -> returns likes for authenticated user
router.get('/likes', authenticate, async (req, res) => {
  try {
    const uid = req.user.id;
    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ likedEvents: (user.likedEvents || []).map(id => String(id)) });
  } catch (err) {
    console.error('Get user likes error:', err);
    const payload = { error: 'Failed to fetch likes' };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = err?.message || String(err);
      payload.stack = err?.stack;
    }
    return res.status(500).json(payload);
  }
});

module.exports = router;
