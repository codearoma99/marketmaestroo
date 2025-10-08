// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createOrder, recordPurchase, getUserPurchases } = require('../controllers/paymentController');
const paymentListController = require('../controllers/paymentListController');
const paymentController = require('../controllers/paymentController');


router.post('/create-order', createOrder);
router.post('/record-purchase', recordPurchase);
router.get('/purchases/:userId', getUserPurchases);
// In your backend routes file
router.get('/api/purchases/:userId', getUserPurchases);


router.post('/package-order', paymentController.packageOrder);


// Get all payments
router.get('/admin/payments', paymentListController.getAllPayments);

// Get payment statistics
router.get('/admin/payments/stats', paymentListController.getPaymentStats);

router.get('/packages/purchases/:userId', paymentController.getUserPackagePurchases);

module.exports = router;