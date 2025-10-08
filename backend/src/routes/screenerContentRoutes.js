const express = require('express');
const router = express.Router();
const screenerContentController = require('../controllers/screenerContentController');

// GET /api/screener-content/1 - Get screener content
router.get('/:id', screenerContentController.getScreenerContent);

// PUT /api/screener-content/1 - Update screener content
router.put('/:id', screenerContentController.updateScreenerContent);

module.exports = router;