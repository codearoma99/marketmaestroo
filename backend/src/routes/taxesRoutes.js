// routes/taxes.routes.js

const express = require('express');
const router = express.Router();
const taxesController = require('../controllers/taxesController');

// get all tax records
router.get('/', taxesController.getAllTaxes);

// update a tax record by id
router.put('/:id', taxesController.updateTax);

router.get('/:productType', taxesController.getTaxesByProductType);

module.exports = router;
