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
    image: String,
    
})