const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // adjust path as needed

// Admin login route
router.post('/login', adminController.loginAdmin);

module.exports = router;