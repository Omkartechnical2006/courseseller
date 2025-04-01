const express = require('express');
const Course = require('../models/Course');
const Purchase = require('../models/Purchase');
const PaymentSettings = require('../models/PaymentSettings');

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
        
        // Get payment settings
        const paymentSettings = await PaymentSettings.getSettings();
        
        // Here you would typically show payment instructions (e.g., UPI ID)
        res.render('user/purchase', { course, paymentSettings });
    } catch (error) {
        console.error("Error fetching course for purchase:", error);
        next(error);
    }
});

// POST route to submit purchase details (email and transaction ID)
router.post('/submit-purchase/:courseId', async (req, res, next) => {
    try {
        const { userEmail, transactionId, userName } = req.body;
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

        // Optional: Validate if course exists again
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

        const newPurchase = new Purchase({
            course: courseId,
            userEmail: userEmail,
            transactionId: transactionId,
            userName: userName || 'Anonymous'
        });
        await newPurchase.save();

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