const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Route: GET /api/cart/count/:userId
router.get('/count/:userId', cartController.getCartItemCount);

module.exports = router;
