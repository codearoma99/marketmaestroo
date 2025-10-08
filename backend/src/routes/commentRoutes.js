// backend/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// POST /api/comments
router.post('/', commentController.createComment);

// Get comments for a specific product
router.get('/:productType/:productId', commentController.getCommentsByProduct);

// Update comment by ID
router.put('/:commentId', commentController.updateComment);

// Delete comment by ID
router.delete('/:commentId', commentController.deleteComment);


module.exports = router;
