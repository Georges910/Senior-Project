const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  parish: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // likedEvents: simple list of event ObjectIds the user liked
  likedEvents: {
    type: [ { type: mongoose.Schema.Types.ObjectId } ],
    default: []
  }
  ,
  // password reset token + expiry
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

// "usercredentials" is the collection name in MongoDB
module.exports = mongoose.model('User', userSchema, 'usercredentials');
