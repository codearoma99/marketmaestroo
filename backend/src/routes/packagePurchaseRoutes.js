const express = require('express');
const router = express.Router();
const packagePurchaseController = require('../controllers/packagePurchaseController');

// POST /api/purchase — record the purchase
router.post('/', packagePurchaseController.recordPurchase);
router.get('/', packagePurchaseController.getAllPurchases);

module.exports = router;