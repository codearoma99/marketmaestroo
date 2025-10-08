// routes/couponRoutes.js
const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// POST - Create
router.post('/coupons', couponController.createCoupon);

// GET - All
router.get('/coupons', couponController.getAllCoupons);

// PUT - Update
router.put('/coupons/:id', couponController.updateCoupon);

// DELETE - Delete
router.delete('/coupons/:id', couponController.deleteCoupon);

// PATCH - Toggle status
router.patch('/coupons/:id/toggle', couponController.toggleStatus);

router.patch('/coupons/:coupon_id/apply', couponController.applyCoupon);

module.exports = router;
