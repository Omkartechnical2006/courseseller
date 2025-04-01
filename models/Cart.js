const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Automatically expire carts after 24 hours of inactivity
    }
});

module.exports = mongoose.model('Cart', cartSchema); 