const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Standard multer disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: {} });

// PDF upload endpoint
const Book = require('../models/Book');
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Save book metadata (title = filename, category empty for now)
  const book = new Book({
    title: req.file.originalname,
    category: '',
    pdfFileId: req.file.filename, // Use filename as ID for local storage
    pdfFileName: req.file.filename,
    uploadedAt: new Date()
  });
  await book.save();
  res.json({ message: 'PDF uploaded', fileId: req.file.filename, filename: req.file.filename, book });
});
// Get all books
router.get('/books', async (req, res) => {
  const books = await Book.find().sort({ uploadedAt: -1 });
  res.json(books);
});

module.exports = router;
