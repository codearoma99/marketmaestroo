const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const courseModulesController = require('../controllers/courseModulesController');

// Set up multer storage for videos and thumbnails
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'videos') {
      cb(null, 'uploads/videos'); // Make sure this folder exists
    } else if (file.fieldname === 'thumbnails') {
      cb(null, 'uploads/thumbnails'); // Make sure this folder exists
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: Infinity  
  }
});

// Get modules by course ID
router.get('/:courseId', courseModulesController.getModulesByCourse);

// Create or update course modules (with file upload)
router.post(
  '/',
  upload.fields([
    { name: 'videos', maxCount: 20 },
    { name: 'thumbnails', maxCount: 20 }
  ]),
  courseModulesController.createOrUpdateCourseModules
);

module.exports = router;