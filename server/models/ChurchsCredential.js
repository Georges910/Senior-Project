const mongoose = require('mongoose');

// Updated Event Schema
const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dates: [{ type: String, required: true }], // multiple dates
  timeFrom: { type: String, required: true }, // start time
  timeTo: { type: String, required: true },   // end time
  location: { type: String, required: true },
  image: { type: String, default: "" },
  type: { 
    type: String, 
    required: true,
    enum: ['معارض وحفلات', 'حديث روحي', 'أمسيات', 'حديث اجتماعي', 'أفلام روحية'],
    default: 'معارض وحفلات'
  }, // Event category for AI recommendations
});

// Updated Church Schema
const ChurchsCredentialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  about: { type: String },
  admins: [{ type: String }],
  images: [{ type: String }], // multiple images
  schedules: [
    {
      name: String,
      time: String,
      date: String,
      notes: String,
    }
  ],
  events: [EventSchema],
});

// This will use the 'churchscredentials' collection in MongoDB
module.exports = mongoose.model('ChurchsCredential', ChurchsCredentialSchema, 'churchscredentials');
