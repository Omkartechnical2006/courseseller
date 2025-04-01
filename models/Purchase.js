const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    transactionId: {
        type: String,
        required: true,
        trim: true,
    },
    customerName: {
        type: String,
        trim: true,
        default: 'Anonymous'
    },
    userName: {
        type: String,
        trim: true,
        default: 'Anonymous'
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending'
    },
    // Add other fields like userLocation if needed
    // userLocation: { type: String },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Purchase', purchaseSchema); 