const express = require('express');
const Course = require('../models/Course');
const Purchase = require('../models/Purchase');
const PaymentSettings = require('../models/PaymentSettings');
const Admin = require('../models/Admin');
const Coupon = require('../models/Coupon');
const isAdmin = require('../middleware/adminAuth');

const router = express.Router();

// All routes in this file require admin authentication
router.use(isAdmin);

// --- Admin Routes ---

// GET route for admin dashboard
router.get('/', async (req, res, next) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        const purchases = await Purchase.find().populate('course').sort({ createdAt: -1 });
        res.render('admin/dashboard', { courses, purchases });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        next(error);
    }
});

// GET route to display the upload form
router.get('/upload', (req, res) => {
    res.render('admin/upload', { message: null, error: null });
});

// POST route to handle course creation
router.post('/upload', async (req, res, next) => {
    try {
        const { heading, description, price, imageUrl } = req.body;
        
        if (!heading || !description) {
            return res.status(400).render('admin/upload', {
                message: null,
                error: 'Heading and description are required.'
            });
        }
        
        if (!imageUrl) {
            return res.status(400).render('admin/upload', {
                message: null,
                error: 'Image URL is required.'
            });
        }
        if (!price || isNaN(price)) {
            return res.status(400).render('admin/upload', {
                message: null,
                error: 'Valid price is required.'
            });
        }

        const newCourse = new Course({
            heading,
            description,
            price: parseFloat(price),
            imageUrl: imageUrl // Store the direct image URL
        });
        await newCourse.save();

        res.render('admin/upload', { message: 'Course added successfully!', error: null });
    } catch (error) {
        console.error("Error adding course:", error);
        // Pass error to the central error handler
        next(error);
    }
});

// GET route to view all purchases
router.get('/purchases', async (req, res, next) => {
    try {
        // Fetch purchases and populate the 'course' field to get course details
        const purchases = await Purchase.find().populate('course').sort({ createdAt: -1 });
        res.render('admin/purchases', { purchases });
    } catch (error) {
        console.error("Error fetching purchases:", error);
        next(error);
    }
});

// GET route to view all courses
router.get('/courses', async (req, res, next) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.render('admin/courses', { courses });
    } catch (error) {
        console.error("Error fetching courses:", error);
        next(error);
    }
});

// GET route to display edit form for a specific course
router.get('/courses/:id/edit', async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).send('Course not found');
        }
        res.render('admin/edit-course', { course, message: null, error: null });
    } catch (error) {
        console.error("Error fetching course for edit:", error);
        next(error);
    }
});

// POST route to update a course
router.post('/courses/:id/update', async (req, res, next) => {
    try {
        const { heading, description, price, imageUrl } = req.body;
        
        if (!heading || !description) {
            const course = await Course.findById(req.params.id);
            return res.status(400).render('admin/edit-course', {
                course,
                message: null,
                error: 'Heading and description are required.'
            });
        }
        
        if (!imageUrl) {
            const course = await Course.findById(req.params.id);
            return res.status(400).render('admin/edit-course', {
                course,
                message: null,
                error: 'Image URL is required.'
            });
        }
        if (!price || isNaN(price)) {
            const course = await Course.findById(req.params.id);
            return res.status(400).render('admin/edit-course', {
                course,
                message: null,
                error: 'Valid price is required.'
            });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id, 
            {
                heading,
                description,
                price: parseFloat(price),
                imageUrl: imageUrl
            },
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).send('Course not found');
        }

        res.redirect('/admin/courses');
    } catch (error) {
        console.error("Error updating course:", error);
        next(error);
    }
});

// POST route to delete a course
router.post('/courses/:id/delete', async (req, res, next) => {
    try {
        const courseId = req.params.id;
        
        // First delete all related purchases
        await Purchase.deleteMany({ course: courseId });
        
        // Then delete the course
        const deletedCourse = await Course.findByIdAndDelete(courseId);
        
        if (!deletedCourse) {
            return res.status(404).send('Course not found');
        }
        
        res.redirect('/admin/courses');
    } catch (error) {
        console.error("Error deleting course:", error);
        next(error);
    }
});

// GET route for payment settings
router.get('/payment-settings', async (req, res, next) => {
    try {
        const settings = await PaymentSettings.getSettings();
        res.render('admin/payment-settings', { 
            paymentSettings: settings,
            message: null,
            error: null
        });
    } catch (error) {
        console.error("Error fetching payment settings:", error);
        next(error);
    }
});

// POST route to update payment settings
router.post('/update-payment-settings', async (req, res, next) => {
    try {
        const settings = await PaymentSettings.getSettings();
        
        // Update all fields
        settings.upiId = req.body.upiId;
        settings.qrCodeUrl = req.body.qrCodeUrl;
        settings.businessName = req.body.businessName;
        settings.telegramSupport = req.body.telegramSupport;
        settings.emailSupport = req.body.emailSupport;
        
        // Update logo settings
        settings.showLogo = req.body.showLogo === 'on';
        settings.logoUrl = req.body.logoUrl || '';
        settings.logoText = req.body.logoText || 'CourseStore';
        
        await settings.save();
        
        res.render('admin/payment-settings', {
            paymentSettings: settings,
            message: 'Payment settings updated successfully!',
            error: null
        });
    } catch (error) {
        console.error("Error updating payment settings:", error);
        res.render('admin/payment-settings', {
            paymentSettings: await PaymentSettings.getSettings(),
            message: null,
            error: 'Error updating payment settings. Please try again.'
        });
    }
});

// POST route to delete a purchase
router.post('/purchases/:id/delete', async (req, res, next) => {
    try {
        const purchaseId = req.params.id;
        
        const deletedPurchase = await Purchase.findByIdAndDelete(purchaseId);
        
        if (!deletedPurchase) {
            return res.status(404).send('Purchase record not found');
        }
        
        res.redirect('/admin/purchases');
    } catch (error) {
        console.error("Error deleting purchase:", error);
        next(error);
    }
});

// POST route to update purchase status
router.post('/purchases/:id/update-status', async (req, res, next) => {
    try {
        const purchaseId = req.params.id;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            { status },
            { new: true }
        );
        
        if (!updatedPurchase) {
            return res.status(404).json({ error: 'Purchase record not found' });
        }
        
        res.status(200).json({ message: 'Status updated successfully', status });
    } catch (error) {
        console.error("Error updating purchase status:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST route to update purchase details
router.post('/purchases/update', async (req, res, next) => {
    try {
        const { purchaseId, transactionId, userEmail, userName, status } = req.body;
        
        if (!purchaseId || !transactionId || !userEmail) {
            return res.status(400).send('Purchase ID, Transaction ID, and User Email are required');
        }
        
        const updateData = {
            transactionId,
            userEmail,
            status: status || 'pending'
        };
        
        if (userName) {
            updateData.userName = userName;
        }
        
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchaseId,
            updateData,
            { new: true }
        );
        
        if (!updatedPurchase) {
            return res.status(404).send('Purchase record not found');
        }
        
        res.redirect('/admin/purchases');
    } catch (error) {
        console.error("Error updating purchase details:", error);
        next(error);
    }
});

// GET route to view all coupons
router.get('/coupons', async (req, res, next) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        const courses = await Course.find({}, '_id heading');
        
        res.render('admin/coupons', { 
            coupons, 
            courses,
            error: req.query.error,
            message: req.query.message 
        });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        next(error);
    }
});

// POST route to create a new coupon
router.post('/coupons/create', async (req, res, next) => {
    try {
        const { 
            code, 
            discountType, 
            discountValue, 
            maxDiscountAmount, 
            minPurchaseAmount,
            validFrom,
            validUntil,
            usageLimit,
            courses,
            isActive
        } = req.body;
        
        // Check if coupon with the same code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.redirect('/admin/coupons?error=Coupon with this code already exists');
        }
        
        // Create the new coupon
        const coupon = new Coupon({
            code,
            discountType,
            discountValue: parseFloat(discountValue),
            maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
            minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0,
            validFrom: validFrom || Date.now(),
            validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            usageLimit: usageLimit || null,
            courses: courses || [],
            isActive: isActive === 'on'
        });
        
        await coupon.save();
        res.redirect('/admin/coupons?message=Coupon created successfully');
    } catch (error) {
        console.error("Error creating coupon:", error);
        res.redirect('/admin/coupons?error=' + encodeURIComponent(error.message));
    }
});

// POST route to update a coupon
router.post('/coupons/:id/update', async (req, res, next) => {
    try {
        const couponId = req.params.id;
        const { 
            discountType, 
            discountValue, 
            maxDiscountAmount, 
            minPurchaseAmount,
            validFrom,
            validUntil,
            usageLimit,
            courses,
            isActive
        } = req.body;
        
        // Update the coupon
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.redirect('/admin/coupons?error=Coupon not found');
        }
        
        coupon.discountType = discountType;
        coupon.discountValue = parseFloat(discountValue);
        coupon.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;
        coupon.minPurchaseAmount = minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0;
        coupon.validFrom = validFrom || coupon.validFrom;
        coupon.validUntil = validUntil || coupon.validUntil;
        coupon.usageLimit = usageLimit || null;
        coupon.courses = courses || [];
        coupon.isActive = isActive === 'on';
        
        await coupon.save();
        res.redirect('/admin/coupons?message=Coupon updated successfully');
    } catch (error) {
        console.error("Error updating coupon:", error);
        res.redirect('/admin/coupons?error=' + encodeURIComponent(error.message));
    }
});

// POST route to delete a coupon
router.post('/coupons/:id/delete', async (req, res, next) => {
    try {
        const couponId = req.params.id;
        
        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
        
        if (!deletedCoupon) {
            return res.status(404).send('Coupon not found');
        }
        
        res.redirect('/admin/coupons?message=Coupon deleted successfully');
    } catch (error) {
        console.error("Error deleting coupon:", error);
        next(error);
    }
});

module.exports = router; 