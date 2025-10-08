const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ebookController = require('../controllers/ebookController');

// Ensure upload folders exist
const uploadDir = path.join(__dirname, '../../uploads');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

// Create directories if they don't exist
[uploadDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'file') {
      // Save ebook files directly in uploads/
      cb(null, uploadDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailsDir);
    } else {
      cb(new Error('Unknown field for upload'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Multer file filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'file') {
    const allowed = ['.pdf', '.epub', '.mobi'];
    if (allowed.includes(ext)) return cb(null, true);
    return cb(new Error('Only PDF, EPUB, or MOBI files are allowed'));
  }

  if (file.fieldname === 'thumbnail') {
    const allowedImages = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowedImages.includes(ext)) return cb(null, true);
    return cb(new Error('Only image files (JPG, PNG, WEBP) are allowed for thumbnails'));
  }

  return cb(new Error('Unsupported field for upload'));
};

const upload = multer({
  storage,
  limits: { 
    fileSize: Infinity 
  }, 
  fileFilter,
});

// Ebook routes
router.post(
  '/',
  upload.fields([
    { name: 'file', maxCount: 1 },       // ebook file
    { name: 'thumbnail', maxCount: 1 },  // thumbnail image
  ]),
  ebookController.createEbook
);

router.get('/', ebookController.getAllEbooks);

// Cart routes for ebooks
router.post('/cart', ebookController.addEbookToCart);            // Add ebook to cart
router.get('/cart/:user_id', ebookController.getEbookCartItems); // Get user's ebook cart items
router.delete('/cart/:id', ebookController.removeCartItem);      // Remove cart item by ID

// Single ebook routes
router.get('/:id', ebookController.getEbookById);

router.put(
  '/:id',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  ebookController.updateEbook
);

router.delete('/:id', ebookController.deleteEbook);

module.exports = router;
