const express = require('express');
const router = express.Router();
const customCouponController = require('../controllers/customCouponController');

router.post('/', customCouponController.createCustomCoupon);
router.get('/', customCouponController.getCustomCoupons);
router.put('/:id', customCouponController.updateCustomCoupon);
router.delete('/:id', customCouponController.deleteCustomCoupon);
router.get('/active-invisible', customCouponController.getInvisibleActiveCoupons);
router.get('/visible', customCouponController.getVisibleCustomCoupons);


module.exports = router;