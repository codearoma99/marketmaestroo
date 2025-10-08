const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

// ✅ Place static or named routes first
router.get('/check-purchase', packageController.checkPackagePurchase);

// Routes with parameters should come **after**
router.post('/', packageController.createPackage);
router.get('/', packageController.getAllPackages);
router.get('/:id/includes', packageController.getPackageIncludes);
router.get('/:id/details', packageController.getPackageDetails);
router.get('/:id', packageController.getPackageTitle);
// Delete package by ID
router.delete('/:id', packageController.deletePackage);

module.exports = router;
