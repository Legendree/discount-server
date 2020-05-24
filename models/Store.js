const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  storeName: {
    type: String,
    minlength: 2,
    maxlength: 16,
    required: true,
    unique: true,
  },
  image: {
    type: String,
    default: 'no-image.jpg',
    required: [true, 'Image of the sale is a required attribute'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Store', storeSchema);
