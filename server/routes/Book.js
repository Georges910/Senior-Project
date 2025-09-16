// backend/routes/books.js
const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// POST a new book
// router.post("/add", async (req, res) => {
//   try {
//     const { title, category, cover, pdfUrl } = req.body;

//     const newBook = new Book({ title, category, cover, pdfUrl });
//     await newBook.save();

//     res.status(201).json({ message: "Book added successfully", book: newBook });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// GET all books
router.get("/book", async (req, res) => {
  try {
    const books = await Book.find(); // fetch all books
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
