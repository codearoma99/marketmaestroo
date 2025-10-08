const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// POST /api/reviews/ebooks
router.post('/ebooks', reviewController.getEbookRatings);
// POST /api/reviews/courses
router.post('/courses', reviewController.getCourseRatings);
// POST /api/reviews/packages
router.post('/packages', reviewController.getPackageRatings);

module.exports = router;