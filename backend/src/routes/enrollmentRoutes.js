const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');

// Get all enrollments
router.get('/admin/enrollments', enrollmentController.getAllEnrollments);

// Get users for dropdown
router.get('/admin/enrollments/users', enrollmentController.getUsers);

// Get courses for dropdown
router.get('/admin/enrollments/courses', enrollmentController.getCourses);

// Get ebooks for dropdown
router.get('/admin/enrollments/ebooks', enrollmentController.getEbooks);

// Create new enrollment
router.post('/admin/enrollments', enrollmentController.createEnrollment);

// Delete an enrollment
router.delete('/admin/enrollments/:id', enrollmentController.deleteEnrollment);

// Update an enrollment
router.put('/admin/enrollments/:id', enrollmentController.updateEnrollment);

module.exports = router;