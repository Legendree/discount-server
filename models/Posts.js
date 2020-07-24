const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  storeName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
  category: {
    type: String,
    enum: ['clothing', 'accesories', 'food', 'electronics', 'beauty', 'home'],
    required: [
      true,
      'Pleaese select one of the categories for this stores discount',
    ],
  },
  description: String,
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
  url: String,
  usersLiked: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    select: false,
  },
  likeCount: Number,
  alias: String,
  isPostLiked: {
    type: Boolean,
    default: false,
  },
});

postSchema.pre('save', function () {
  this.likeCount = this.usersLiked.length;
});

module.exports = mongoose.model('Post', postSchema);
