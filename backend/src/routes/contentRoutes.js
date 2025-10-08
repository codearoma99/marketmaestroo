const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const upload = require('../middlewares/uploadContent');

// Use multer for file + field handling (single record update)
router.put('/', upload.any(), contentController.updateContent);
router.get('/', contentController.getContent);

module.exports = router;
