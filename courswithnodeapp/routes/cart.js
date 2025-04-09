const express = require('express');
const Cart = require('../models/Cart');
const Course = require('../models/Course');
const PaymentSettings = require('../models/PaymentSettings');

const router = express.Router();

// GET route to view cart
router.get('/', async (req, res, next) => {
    try {
        // Cart is already loaded in middleware
        const cart = res.locals.cart;
        let totalPrice = 0;
        
        // Calculate total price
        if (cart && cart.items && cart.items.length > 0) {
            totalPrice = cart.items.reduce((sum, item) => {
                return sum + (item.course ? parseFloat(item.course.price) : 0);
            }, 0);
        }
        
        res.render('user/cart', { 
            cart: cart, 
            totalPrice: totalPrice 
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        next(error);
    }
});

// GET route to get cart count for AJAX updates
router.get('/count', async (req, res) => {
    try {
        const cart = res.locals.cart;
        const count = cart && cart.items ? cart.items.length : 0;
        res.json({ count });
    } catch (error) {
        console.error("Error getting cart count:", error);
        res.status(500).json({ error: "Error getting cart count" });
    }
});

// POST route to add item to cart
router.post('/add/:courseId', async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        
        // Verify the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }
        
        // Find cart for this session
        let cart = await Cart.findOne({ sessionId: req.session.sessionId });
        
        if (!cart) {
            // Create new cart if none exists
            cart = new Cart({ 
                sessionId: req.session.sessionId, 
                items: [{ course: courseId }] 
            });
        } else {
            // Check if course is already in cart
            const existingItem = cart.items.find(item => 
                item.course && item.course.toString() === courseId
            );
            
            if (!existingItem) {
                // Add new item if not already in cart
                cart.items.push({ course: courseId });
            }
        }
        
        // Save updated cart
        await cart.save();
        
        // If this is an AJAX request, send JSON response
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ 
                success: true, 
                itemCount: cart.items.length,
                message: 'Item added to cart successfully'
            });
        }
        
        // Otherwise redirect as before
        const redirect = req.query.redirect || '/cart';
        res.redirect(redirect);
    } catch (error) {
        console.error("Error adding to cart:", error);
        // Handle AJAX error
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, error: error.message });
        }
        next(error);
    }
});

// POST route to remove item from cart
router.post('/remove/:courseId', async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        let cart = await Cart.findOne({ sessionId: req.session.sessionId });
        
        if (cart) {
            // Filter out the item to remove
            cart.items = cart.items.filter(item => 
                !item.course || item.course.toString() !== courseId
            );
            await cart.save();
        }
        
        // If this is an AJAX request, send JSON response
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ 
                success: true, 
                itemCount: cart ? cart.items.length : 0 
            });
        }
        
        // Otherwise redirect as before
        res.redirect('/cart');
    } catch (error) {
        console.error("Error removing from cart:", error);
        // Handle AJAX error
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, error: error.message });
        }
        next(error);
    }
});

// GET route to checkout all items in cart
router.get('/checkout', async (req, res, next) => {
    try {
        const cart = res.locals.cart;
        
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.redirect('/cart');
        }
        
        let totalPrice = cart.items.reduce((sum, item) => {
            return sum + (item.course ? parseFloat(item.course.price) : 0);
        }, 0);
        
        // Get payment settings
        const paymentSettings = await PaymentSettings.getSettings();
        
        res.render('user/checkout', { 
            cart: cart,
            totalPrice: totalPrice,
            paymentSettings: paymentSettings
        });
    } catch (error) {
        console.error("Error checking out:", error);
        next(error);
    }
});

module.exports = router; 