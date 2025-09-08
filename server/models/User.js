const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  parish: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// "usercredentials" is the collection name in MongoDB
module.exports = mongoose.model('User', userSchema, 'usercredentials');
