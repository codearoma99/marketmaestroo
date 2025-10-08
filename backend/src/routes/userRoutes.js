const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET all users
router.get('/', userController.getAllUsers);
// POST /api/users/register
router.post('/register', userController.registerUser);
// userRoutes.js
router.post('/login', userController.loginUser);


// New routes for edit & delete
router.get('/:id', userController.getUserById);         // Get single user by ID
router.put('/:id', userController.updateUser);           // Update user
router.delete('/:id', userController.deleteUser);        // Delete user

module.exports = router;