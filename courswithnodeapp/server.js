require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/admin-auth');
const userRoutes = require('./routes/user');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 3000;


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coursestore')
    .then(async () => {
        console.log('MongoDB connected successfully.');

        // Initialize Admin model after successful database connection
        try {
            const Admin = require('./models/Admin');

            // Check if admin exists
            const adminCount = await Admin.countDocuments();

            // Create default admin if needed
            if (adminCount === 0) {
                const defaultAdmin = new Admin({
                    username: 'admin',
                    password: 'admin123'
                });
                await defaultAdmin.save();
            }
        } catch (error) {
            console.error('Error initializing admin:', error);
        }

        // Start Server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if cannot connect to DB
    });

// Middleware
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.json()); // for parsing application/json

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'course-app-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Generate session ID if not exists
app.use((req, res, next) => {
    if (!req.session.sessionId) {
        req.session.sessionId = uuidv4();
    }
    next();
});

// Add cart data to all responses
app.use(async (req, res, next) => {
    try {
        const Cart = require('./models/Cart');
        // Find or create cart for this session
        let cart = await Cart.findOne({ sessionId: req.session.sessionId }).populate('items.course');

        if (!cart) {
            cart = new Cart({ sessionId: req.session.sessionId, items: [] });
            await cart.save();
        }

        // Add cart to res.locals so it's available in all templates
        res.locals.cart = cart;
        res.locals.cartItemCount = cart.items.length;
        next();
    } catch (error) {
        console.error('Error with cart middleware:', error);
        next();
    }
});

// Add payment settings to all responses
app.use(async (req, res, next) => {
    try {
        const PaymentSettings = require('./models/PaymentSettings');
        const paymentSettings = await PaymentSettings.getSettings();
        res.locals.paymentSettings = paymentSettings;
        next();
    } catch (error) {
        console.error('Error with payment settings middleware:', error);
        next();
    }
});

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// Admin auth routes first, then admin routes
app.use('/admin', adminAuthRoutes);
app.use('/admin', adminRoutes);
app.use('/cart', cartRoutes);
app.use('/', userRoutes);

// Basic Error Handling (can be improved)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
}); 