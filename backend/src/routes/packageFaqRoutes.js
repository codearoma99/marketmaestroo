// backend/src/routes/packageFaqRoutes.js
const express = require('express');
const router = express.Router();
const packageFaqController = require('../controllers/packageFaqController');

// POST to add multiple FAQs for a package
router.post('/', packageFaqController.createPackageFaqs);

// GET FAQs for a package (optional, if you want)
router.get('/:package_id', packageFaqController.getPackageFaqs);

module.exports = router;
