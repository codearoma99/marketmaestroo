// controllers/contentController.js
const pool = require('../db');

// Get content by ID = 1
exports.getContent = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM content WHERE id = $1', [1]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching content:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update content by ID = 1
exports.updateContent = async (req, res) => {
  try {
    const fields = req.body; // Fields come from multer
    const files = req.files; // Uploaded images

    // Map file field names to file names
    if (files && files.length > 0) {
      files.forEach(file => {
        fields[file.fieldname] = file.filename; // Save only filename
      });
    }

    const fieldNames = Object.keys(fields);
    const values = Object.values(fields);

    if (fieldNames.length === 0) {
      return res.status(400).json({ message: 'No data provided to update' });
    }

    const setQuery = fieldNames.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
    const updateQuery = `UPDATE content SET ${setQuery} WHERE id = 1 RETURNING *`;

    const result = await pool.query(updateQuery, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating content:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
