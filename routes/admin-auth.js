const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const isAdmin = require('../middleware/adminAuth');

// Login routes (unprotected)
router.get('/login', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        let { username, password } = req.body;
        
        // Trim inputs
        username = username.trim();
        password = password.trim();
        
        
        // Get all admins for debugging
        const allAdmins = await Admin.find({});
        
        // Try case-insensitive search
        const admin = await Admin.findOne({
            username: { $regex: new RegExp('^' + username + '$', 'i') }
        });
        
        if (admin) {
            // For default admin123 password or exact match
            if (admin.password === password || 
                (admin.username.toLowerCase() === 'admin' && 
                 password === 'admin123')) {
                req.session.isAdmin = true;
                return res.redirect('/admin');
            }
        }
        
        // If no admin exists yet, create one with default credentials
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0 && username.toLowerCase() === 'admin' && password === 'admin123') {
            await Admin.create({ username: 'admin', password: 'admin123' });
            req.session.isAdmin = true;
            return res.redirect('/admin');
        }
        
        return res.render('admin/login', { error: 'Invalid username or password' });
    } catch (error) {
        console.error('Login error:', error);
        return res.render('admin/login', { error: 'An error occurred during login' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Admin credentials management
router.get('/credentials', isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findOne();
        res.render('admin/credentials', { 
            admin,
            message: null,
            error: null
        });
    } catch (error) {
        res.status(500).send('Error loading credentials');
    }
});

router.post('/credentials', isAdmin, async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const admin = await Admin.findOne();

       

        if (!admin) {
            return res.render('admin/credentials', {
                admin: { username: 'admin' },
                message: null,
                error: 'Admin account not found. Please contact support.'
            });
        }

        // Check if current password matches
        // Special case for 'admin123' or exact match
        if (admin.password === currentPassword || 
            (admin.username.toLowerCase() === 'admin' && 
             currentPassword === 'admin123')) {
            
            // Update credentials
            admin.username = username;
            admin.password = newPassword;
            await admin.save();
            
            
            return res.render('admin/credentials', {
                admin,
                message: 'Credentials updated successfully',
                error: null
            });
        } else {
            return res.render('admin/credentials', {
                admin,
                message: null,
                error: 'Current password is incorrect'
            });
        }
    } catch (error) {
        const admin = await Admin.findOne();
        res.render('admin/credentials', {
            admin: admin || { username: 'admin' },
            message: null,
            error: 'Error updating credentials: ' + error.message
        });
    }
});

module.exports = router; 