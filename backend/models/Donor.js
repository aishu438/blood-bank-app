// models/Donor.js
const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  name: String,
  bloodGroup: String,
  email: String,
  contact: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donor', donorSchema);
