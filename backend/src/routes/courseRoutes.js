const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const courseController = require('../controllers/courseController');
const db = require('../db'); // Needed for check-course-in-cart route

// Multer storage config for thumbnails
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '../../uploads/thumbnails')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `thumbnail-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Infinity  }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.get('/', courseController.getAllCourses);
router.get('/:id/modules', courseController.getModulesByCourseId);
router.get('/:id', courseController.getCourseById);
router.post('/add-to-cart', courseController.addToCart);
router.get('/cart/:user_id', courseController.getCartItems); // FIXED: use courseController here
router.delete('/cart/:id', courseController.removeCartItem);
router.put('/:id', upload.single('thumbnail'), courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);
router.get('/:courseId/purchase-status', courseController.hasUserPurchasedCourse);

// Check if course is in cart
router.get('/check-course-in-cart', async (req, res) => {
  const { user_id, course_id } = req.query;

  if (!user_id || !course_id) {
    return res.status(400).json({ message: 'Missing user_id or course_id' });
  }

  try {
    const existing = await db.query(
      'SELECT 1 FROM cart WHERE user_id = $1 AND course_id = $2 LIMIT 1',
      [user_id, course_id]
    );

    res.json({ inCart: existing.rows.length > 0 });
  } catch (error) {
    console.error('Error checking course in cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', upload.single('thumbnail'), courseController.createCourse);

// router.get('/:courseId', controller.getModulesByCourse);
// router.put(
//   '/',
//   upload.fields([{ name: 'videos' }, { name: 'thumbnails' }]),
//   controller.updateCourseModules
// );
module.exports = router;
