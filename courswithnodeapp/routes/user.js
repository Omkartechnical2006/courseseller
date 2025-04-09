const express = require('express');
const Course = require('../models/Course');
const Purchase = require('../models/Purchase');
const PaymentSettings = require('../models/PaymentSettings');
const Coupon = require('../models/Coupon');

const router = express.Router();

// GET route to display all available courses
router.get('/', async (req, res, next) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.render('user/courses', { courses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        next(error);
    }
});

// GET route to show purchase page for a specific course
// This simulates the user clicking "Buy" and being ready to pay
router.get('/purchase/:courseId', async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).send('Course not found');
        }
        
        // Reset any existing coupon for this course when viewing the purchase page
        if (req.session.coupons && req.session.coupons[req.params.courseId]) {
            delete req.session.coupons[req.params.courseId];
        }
        
        // Get payment settings
        const paymentSettings = await PaymentSettings.getSettings();
        
        // Initialize discount info
        const discountInfo = {
            appliedCoupon: null,
            originalPrice: course.price,
            discountAmount: 0,
            finalPrice: course.price
        };
        
        // Here you would typically show payment instructions (e.g., UPI ID)
        res.render('user/purchase', { 
            course, 
            paymentSettings, 
            discountInfo,
            couponError: req.query.couponError
        });
    } catch (error) {
        console.error("Error fetching course for purchase:", error);
        next(error);
    }
});

// POST route to validate and apply coupon
router.post('/validate-coupon', async (req, res, next) => {
    try {
        const { couponCode, courseId } = req.body;
        
        if (!couponCode || !courseId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Coupon code and course ID are required' 
            });
        }
        
        // Find the coupon by code
        const coupon = await Coupon.findOne({ 
            code: couponCode.toUpperCase(),
            isActive: true
        });
        
        if (!coupon) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid coupon code' 
            });
        }
        
        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }
        
        // Validate the coupon
        const validationResult = coupon.isValid(courseId, course.price);
        if (!validationResult.valid) {
            return res.status(400).json({ 
                success: false, 
                message: validationResult.reason 
            });
        }
        
        // Calculate the discount
        const discountAmount = coupon.calculateDiscount(course.price);
        const finalPrice = Math.max(0, course.price - discountAmount);
        
        // Store coupon validation information in session with timestamp
        if (!req.session.coupons) {
            req.session.coupons = {};
        }
        
        req.session.coupons[courseId] = {
            code: coupon.code,
            timestamp: Date.now(),
            originalPrice: course.price,
            discountAmount: discountAmount,
            finalPrice: finalPrice
        };
        
        res.json({
            success: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            },
            originalPrice: course.price,
            discountAmount,
            finalPrice,
            timestamp: Date.now(),
            message: 'Coupon applied successfully'
        });
    } catch (error) {
        console.error("Error validating coupon:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// POST route to submit purchase details (email and transaction ID)
router.post('/submit-purchase/:courseId', async (req, res, next) => {
    try {
        const { userEmail, transactionId, userName, couponCode, validationTime, sessionToken } = req.body;
        const courseId = req.params.courseId;
        
        // Get payment settings for support contact info
        const paymentSettings = await PaymentSettings.getSettings();

        if (!userEmail || !transactionId) {
            return res.render('user/error', {
                error: {
                    title: 'Missing Information',
                    message: 'Email and Transaction ID are required.',
                    description: 'Please go back and fill in all the required fields.'
                },
                paymentSettings
            });
        }

        // Check if this transaction ID has been used before
        const existingPurchase = await Purchase.findOne({ transactionId: transactionId });
        if (existingPurchase) {
            return res.render('user/error', {
                error: {
                    title: 'Duplicate Transaction',
                    message: 'This Transaction ID has already been used.',
                    description: 'Each transaction can only be used once. If you believe this is an error, please contact our support team.',
                    showSupport: true
                },
                paymentSettings
            });
        }

        // Validate if course exists again
        const course = await Course.findById(courseId);
        if (!course) {
            return res.render('user/error', {
                error: {
                    title: 'Course Not Found',
                    message: 'The course you are trying to purchase no longer exists.',
                    description: 'The course may have been removed or the link is invalid.'
                },
                paymentSettings
            });
        }

        // Initialize pricing variables
        let originalPrice = course.price;
        let discountAmount = 0;
        let finalPrice = course.price;
        let couponUsed = null;

        // Helper function to generate the same session token as the client
        function generateSessionToken(couponCode, timestamp, courseId) {
            const combined = couponCode + timestamp + courseId;
            let hash = 0;
            for (let i = 0; i < combined.length; i++) {
                const char = combined.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }

        // If coupon code is provided, validate it with security checks
        if (couponCode) {
            // Verify coupon timestamp is valid (not too old) and session token matches
            const couponExpiry = 30 * 60 * 1000; // 30 minutes in milliseconds
            const timestamp = parseInt(validationTime, 10);
            const currentTime = Date.now();
            
            // Check if timestamp is valid and not expired
            if (timestamp && !isNaN(timestamp) && (currentTime - timestamp < couponExpiry)) {
                // Verify session token matches expected value
                const expectedToken = generateSessionToken(couponCode, timestamp, courseId);
                
                if (sessionToken === expectedToken) {
                    // Check for session-based coupon validation first
                    const sessionCoupon = req.session.coupons && req.session.coupons[courseId];
                    
                    if (sessionCoupon && sessionCoupon.code === couponCode && 
                        currentTime - sessionCoupon.timestamp < couponExpiry) {
                        // Use the pre-validated coupon from session
                        originalPrice = sessionCoupon.originalPrice;
                        discountAmount = sessionCoupon.discountAmount;
                        finalPrice = sessionCoupon.finalPrice;
                        couponUsed = sessionCoupon.code;
                        
                        // Update coupon usage
                        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
                        if (coupon) {
                            coupon.usedCount += 1;
                            await coupon.save();
                        }
                    } 
                    // If no valid session coupon or coupon doesn't match, validate again
                    else {
                        const coupon = await Coupon.findOne({ 
                            code: couponCode.toUpperCase(),
                            isActive: true
                        });
                        
                        if (coupon) {
                            // Validate the coupon
                            const validationResult = coupon.isValid(courseId, course.price);
                            if (validationResult.valid) {
                                // Calculate the discount
                                discountAmount = coupon.calculateDiscount(course.price);
                                finalPrice = Math.max(0, course.price - discountAmount);
                                
                                // Increment the coupon usage counter
                                coupon.usedCount += 1;
                                await coupon.save();
                                
                                couponUsed = coupon.code;
                            }
                        }
                    }
                } else {
                    console.log("Session token mismatch, ignoring coupon");
                }
            } else {
                console.log("Coupon timestamp expired or invalid, ignoring coupon");
            }
        }

        const newPurchase = new Purchase({
            course: courseId,
            userEmail: userEmail,
            transactionId: transactionId,
            userName: userName || 'Anonymous',
            couponCode: couponUsed,
            originalPrice,
            discountAmount,
            finalPrice
        });
        await newPurchase.save();

        // Clear the coupon from session after purchase is completed
        if (req.session.coupons && req.session.coupons[courseId]) {
            delete req.session.coupons[courseId];
        }

        // Redirect to a success page
        res.redirect('/success');
    } catch (error) {
        console.error("Error submitting purchase:", error);
        // Handle potential validation errors (e.g., invalid email format)
        if (error.name === 'ValidationError') {
             return res.status(400).send('Invalid input: ' + error.message);
        }
        next(error);
    }
});

// POST route to submit cart purchase details
router.post('/submit-cart-purchase', async (req, res, next) => {
    try {
        const { userEmail, transactionId, userName } = req.body;
        const cart = res.locals.cart;
        
        // Get payment settings for support contact info
        const paymentSettings = await PaymentSettings.getSettings();

        if (!userEmail || !transactionId) {
            return res.render('user/error', {
                error: {
                    title: 'Missing Information',
                    message: 'Email and Transaction ID are required.',
                    description: 'Please go back and fill in all the required fields.'
                },
                paymentSettings
            });
        }

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.render('user/error', {
                error: {
                    title: 'Empty Cart',
                    message: 'Your cart is empty.',
                    description: 'Please add some courses to your cart before proceeding to checkout.'
                },
                paymentSettings
            });
        }

        // Check if this transaction ID has been used before
        const existingPurchase = await Purchase.findOne({ transactionId: transactionId });
        if (existingPurchase) {
            return res.render('user/error', {
                error: {
                    title: 'Duplicate Transaction',
                    message: 'This Transaction ID has already been used.',
                    description: 'Each transaction can only be used once. If you believe this is an error, please contact our support team.',
                    showSupport: true
                },
                paymentSettings
            });
        }

        // Create a purchase record for each course in the cart
        const purchases = [];
        for (const item of cart.items) {
            if (item.course) {
                const newPurchase = new Purchase({
                    course: item.course._id,
                    userEmail: userEmail,
                    transactionId: transactionId,
                    userName: userName || 'Anonymous'
                });
                purchases.push(newPurchase.save());
            }
        }

        // Wait for all purchases to be saved
        await Promise.all(purchases);

        // Clear the cart
        cart.items = [];
        await cart.save();

        // Redirect to success page
        res.redirect('/success');
    } catch (error) {
        console.error("Error submitting cart purchase:", error);
        if (error.name === 'ValidationError') {
             return res.status(400).send('Invalid input: ' + error.message);
        }
        next(error);
    }
});

// GET route for the success page
router.get('/success', (req, res) => {
    res.render('user/success');
});

module.exports = router; 