const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null
    },
    minPurchaseAmount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    usageLimit: {
        type: Number,
        default: null // null means unlimited
    },
    usedCount: {
        type: Number,
        default: 0
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }], // If empty, applies to all courses
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function(courseId, purchaseAmount) {
    const now = new Date();
    
    // Check if coupon is active
    if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
    
    // Check expiration
    if (now > this.validUntil) return { valid: false, reason: 'Coupon has expired' };
    if (now < this.validFrom) return { valid: false, reason: 'Coupon is not yet active' };
    
    // Check usage limit
    if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }
    
    // Check minimum purchase amount
    if (purchaseAmount < this.minPurchaseAmount) {
        return { valid: false, reason: `Minimum purchase amount of ₹${this.minPurchaseAmount} required` };
    }
    
    // Check if course is eligible
    if (this.courses && this.courses.length > 0) {
        if (!courseId || !this.courses.some(c => c.toString() === courseId.toString())) {
            return { valid: false, reason: 'Coupon not valid for this course' };
        }
    }
    
    return { valid: true, reason: null };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(originalPrice) {
    let discountAmount = 0;
    
    if (this.discountType === 'percentage') {
        discountAmount = (originalPrice * this.discountValue) / 100;
        
        // Apply max discount cap if specified
        if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
            discountAmount = this.maxDiscountAmount;
        }
    } else { // fixed discount
        discountAmount = this.discountValue;
        
        // Ensure discount doesn't exceed price
        if (discountAmount > originalPrice) {
            discountAmount = originalPrice;
        }
    }
    
    return discountAmount;
};

module.exports = mongoose.model('Coupon', couponSchema); 