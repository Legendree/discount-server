const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  storeName: {
    type: String,
    minlength: 2,
    maxlength: 16,
    required: true,
  },
  category: {
    type: String,
    enum: ['clothing', 'accessories', 'food', 'electronics', 'beauty'],
    required: [
      true,
      'Pleaese select one of the categories for this stores discount',
    ],
  },
  description: {
    type: String,
    minlength: 5,
    maxlength: 128,
    required: true,
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
  expiresAt: {
    type: Date,
    required: [true, 'Please enter experation date for this sale'],
  },
  storeColor: Number,
  usersLiked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
});

module.exports = mongoose.model('Post', postSchema);
