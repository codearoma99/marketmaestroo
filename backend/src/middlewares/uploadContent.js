const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/content folder exists
const uploadDir = path.join(__dirname, '../uploads/content');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Save only image name
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const finalName = `${name}-${Date.now()}${ext}`;
    cb(null, finalName);
  },
});

const upload = multer({ storage });

module.exports = upload;
