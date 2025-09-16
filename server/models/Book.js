const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String },
  cover: { type: String }, // cover image URL
  pdfUrl: { type: String, required: true }, // Cloudinary PDF URL
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Book", BookSchema);
