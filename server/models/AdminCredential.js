const mongoose = require('mongoose');

const AdminCredentialSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  password: { type: String, required: true },
  church: { type: String, required: true }
});

module.exports = mongoose.model('AdminCredential', AdminCredentialSchema, 'admincredentials');
