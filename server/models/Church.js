const mongoose = require('mongoose');

const churchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Church', churchSchema, 'churches');