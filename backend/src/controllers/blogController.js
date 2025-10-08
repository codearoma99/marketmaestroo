const pool = require('../db');
const path = require('path');
const fs = require('fs');  // <-- added this import

exports.createBlog = async (req, res) => {
  try {
    const { title, description, content } = req.body;
    const image = req.file ? req.file.filename : null;

    const query = `
      INSERT INTO blogs (title, description, content, image, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;

    const values = [title, description, content, image];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, blog: result.rows[0] });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blogs ORDER BY created_at DESC');
    res.status(200).json({ success: true, blogs: result.rows });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, description } = req.body;  // <-- Add description here
    const image = req.file ? req.file.filename : null;

    // Get old image (if exists)
    const existing = await pool.query('SELECT image FROM blogs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const oldImage = existing.rows[0].image;

    // Update blog with description included
    const query = `
      UPDATE blogs
      SET title = $1,
          content = $2,
          description = $3,
          image = COALESCE($4, image),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const values = [title, content, description, image, id];
    const result = await pool.query(query, values);

    // Delete old image file if new one is uploaded
    if (image && oldImage && oldImage !== image) {
      const filePath = path.join(__dirname, '..', 'uploads', oldImage);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete old image:', err);
      });
    }

    res.status(200).json({ success: true, blog: result.rows[0] });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    // Find blog to delete
    const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const blog = result.rows[0];

    // Delete blog from DB
    await pool.query('DELETE FROM blogs WHERE id = $1', [id]);

    // Delete image file
    if (blog.image) {
      const filePath = path.join(__dirname, '..', 'uploads', blog.image);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete image file:', err);
      });
    }

    res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getBlogById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
