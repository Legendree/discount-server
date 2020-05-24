const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  storeName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
  category: {
    type: String,
    enum: ['clothing', 'accesories', 'food', 'electronics', 'beauty'],
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
  usersLiked: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  likeCount: Number,
});

postSchema.pre('save', function () {
  this.likeCount = this.usersLiked.length;
});

module.exports = mongoose.model('Post', postSchema);
