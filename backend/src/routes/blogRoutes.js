const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Controller functions
const {
  createBlog,
  getAllBlogs,
  updateBlog,
  deleteBlog,
  getBlogById,
} = require('../controllers/blogController');

// Ensure 'uploads/' directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use Date.now + sanitized original filename to avoid spaces and conflicts
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

// Initialize multer with storage config and optional file filter (if needed)
const upload = multer({ storage });

// Routes

// Create a new blog post with optional image upload
router.post('/blogs', upload.single('image'), createBlog);

// Retrieve all blogs
router.get('/blogs', getAllBlogs);

// Update a blog by id with optional image upload
router.put('/blogs/:id', upload.single('image'), updateBlog);

// Get details of a single blog by id
router.get('/blog-details/:id', getBlogById);

// Delete a blog by id
router.delete('/blogs/:id', deleteBlog);

module.exports = router;
