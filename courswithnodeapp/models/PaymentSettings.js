const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema({
    upiId: {
        type: String,
        required: true,
        default: 'courseprovider@postbank'
    },
    qrCodeUrl: {
        type: String,
        required: true,
        default: 'https://i.ibb.co/TxydRjb5/IMG-20250331-WA0000.jpg'
    },
    businessName: {
        type: String,
        required: true,
        default: 'CourseStore'
    },
    telegramSupport: {
        type: String,
        required: true,
        default: 'https://t.me/course_provider01'
    },
    emailSupport: {
        type: String,
        required: true,
        default: 'support@courseprovider.com'
    },
    showLogo: {
        type: Boolean,
        default: false
    },
    logoUrl: {
        type: String,
        default: ''
    },
    logoText: {
        type: String,
        default: 'CourseStore'
    }
}, { timestamps: true });

// Since we only need one payment settings document in the database,
// we'll use a static method to provide easy access to it
paymentSettingsSchema.statics.getSettings = async function() {
    // Find the first document or create if none exists
    let settings = await this.findOne({});
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema); 