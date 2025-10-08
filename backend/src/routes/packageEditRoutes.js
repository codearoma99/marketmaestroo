// backend/src/routes/packageEditRoutes.js
const express = require('express');
const router = express.Router();
const packageEditController = require('../controllers/packageEditController');

// Route to update full package info (main, includes, faqs)
router.put('/:id/edit', packageEditController.updateFullPackage); // ✅ Correct

module.exports = router;
