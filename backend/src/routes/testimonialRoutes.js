// backend/src/routes/testimonialRoutes.js
const express = require('express');
const router = express.Router();
const { createTestimonial, getAllTestimonials, updateTestimonialStatus } = require('../controllers/testimonialController');

router.post('/', createTestimonial);
// GET all testimonials
router.get('/', getAllTestimonials);

// PUT update status
router.put('/:id/status', updateTestimonialStatus);

module.exports = router;
