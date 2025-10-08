const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// Category Routes
router.get('/categories', faqController.getAllCategories);
router.post('/categories', faqController.createCategory);
router.put('/categories/:id', faqController.updateCategory);
router.delete('/categories/:id', faqController.deleteCategory);

// FAQ Item Routes
router.get('/items', faqController.getAllFaqItems);
router.post('/items', faqController.createFaqItem);
router.put('/items/:id', faqController.updateFaqItem);
router.delete('/items/:id', faqController.deleteFaqItem);
router.post('/items/bulk', faqController.createFaqItemsBulk);

module.exports = router;
