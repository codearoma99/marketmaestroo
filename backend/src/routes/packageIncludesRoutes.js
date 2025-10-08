// backend/src/routes/packageIncludesRoutes.js
const express = require('express');
const router = express.Router();
const packageIncludesController = require('../controllers/packageIncludesController');

// Route to add multiple includes
router.post('/', packageIncludesController.createPackageIncludes);

// Route to fetch package title by ID
router.get('/:id', packageIncludesController.getPackageTitle);

module.exports = router;
