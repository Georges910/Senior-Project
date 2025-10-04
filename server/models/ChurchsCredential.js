const mongoose = require('mongoose');

const ChurchsCredentialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  about: { type: String },
  admins: [{ type: String }],
  schedules: [
    {
      name: String,
      time: String,
      date: String,
      notes: String
    }
  ],
  events: [
    {
      title: String,
      date: String,
      description: String
    }
  ],
});

// This will use the 'churchscredentials' collection in MongoDB
module.exports = mongoose.model('ChurchsCredential', ChurchsCredentialSchema, 'churchscredentials');
