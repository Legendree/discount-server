const mongoose = require('mongoose');


const saleSchema = new mongoose.Schema({
    storeName: {
        type: String,
        minlength: 2,
        maxlength: 16,
        required: true
    },
    description: {
        type: String,
        minlength: 5,
        maxlength: 128,
        required: true
    },
    image: {
        type: String,
        default: 'no-image.jpg',
        required: [true, 'Image of the sale is a required attribute']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: [true, 'Please enter experation date for this sale']
    },
    storeColor: Number,
})

module.exports = mongoose.model('Sale', saleSchema);