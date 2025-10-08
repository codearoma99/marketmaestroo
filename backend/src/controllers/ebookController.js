// backend/src/controllers/ebookController.js
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');


exports.createEbook = async (req, res) => {
  const { title, description, price, downloadable } = req.body;
  const files = req.files;

  if (!files || !files.file || files.file.length === 0) {
    return res.status(400).json({ message: 'Ebook file is required' });
  }

  const ebookFile = files.file[0];
  const thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;

  try {
    const downloadableInt = downloadable === '1' || downloadable === 1 ? 1 : 0;

    const result = await db.query(
      `INSERT INTO ebooks (title, description, price, ebook, thumbnail, downloadable, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [
        title,
        description,
        price,
        ebookFile.filename,
        thumbnailFile ? thumbnailFile.filename : null,
        downloadableInt
      ]
    );

    res.status(201).json({
      message: 'Ebook uploaded successfully',
      ebook: result.rows[0]
    });

  } catch (err) {
    console.error('Error inserting ebook:', err);
    res.status(500).json({
      message: 'Failed to upload ebook',
      error: err.message
    });
  }
};

// get all ebooks
exports.getAllEbooks = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ebooks ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching ebooks:', err);
    res.status(500).json({ message: 'Failed to fetch ebooks', error: err.message });
  }
};


exports.updateEbook = async (req, res) => {
  const { id } = req.params;
  const { title, description, price } = req.body;

  const files = req.files || {};
  const ebookFile = files.file ? files.file[0] : null;
  const thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;

  console.log('--- Update Ebook Debug ---');
  console.log('Ebook ID:', id);
  console.log('Request body:', { title, description, price });
  console.log('Files received:', files);
  if (ebookFile) {
    console.log('New ebook file:', ebookFile.filename, ebookFile.path);
  }
  if (thumbnailFile) {
    console.log('New thumbnail file:', thumbnailFile.filename, thumbnailFile.path);
  }

  try {
    // Get existing ebook record
    const existing = await db.query('SELECT * FROM ebooks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      console.log('Ebook not found for ID:', id);
      return res.status(404).json({ message: 'Ebook not found' });
    }
    const existingEbook = existing.rows[0];
    console.log('Existing ebook record:', existingEbook);

    // Delete old ebook file if new one uploaded
    if (ebookFile && existingEbook.ebook) {
      const oldFilePath = path.join(__dirname, '../../uploads', existingEbook.ebook);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log('Deleted old ebook file:', oldFilePath);
      } else {
        console.log('Old ebook file not found for deletion:', oldFilePath);
      }
    }

    // Delete old thumbnail file if new one uploaded
    if (thumbnailFile && existingEbook.thumbnail) {
      const oldThumbPath = path.join(__dirname, '../../uploads/thumbnails', existingEbook.thumbnail);
      if (fs.existsSync(oldThumbPath)) {
        fs.unlinkSync(oldThumbPath);
        console.log('Deleted old thumbnail file:', oldThumbPath);
      } else {
        console.log('Old thumbnail file not found for deletion:', oldThumbPath);
      }
    }

    // Update ebook record in DB
    const updated = await db.query(
      `UPDATE ebooks
       SET title = $1,
           description = $2,
           price = $3,
           ebook = COALESCE($4, ebook),
           thumbnail = COALESCE($5, thumbnail),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        title,
        description,
        price,
        ebookFile ? ebookFile.filename : null,
        thumbnailFile ? thumbnailFile.filename : null,
        id
      ]
    );

    console.log('Updated ebook record:', updated.rows[0]);

    res.status(200).json({
      message: 'Ebook updated successfully',
      ebook: updated.rows[0]
    });

  } catch (err) {
    console.error('Error updating ebook:', err);
    res.status(500).json({
      message: 'Failed to update ebook',
      error: err.message
    });
  }
};


// Get ebook by ID
exports.getEbookById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM ebooks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ebook not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching ebook:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete ebook by ID
exports.deleteEbook = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM ebooks WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Ebook not found' });
    }

    res.status(200).json({ message: 'Ebook deleted successfully' });
  } catch (err) {
    console.error('Error deleting ebook:', err);
    res.status(500).json({ message: 'Failed to delete ebook', error: err.message });
  }
};


// Add ebook to cart
exports.addEbookToCart = async (req, res) => {
  try {
    const { user_id, course_id, price } = req.body;

    console.log('user_id:', user_id);
    console.log('course_id:', course_id);
    console.log('price:', price);

    if (user_id == null || course_id == null || price == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if ebook already in cart for this user
    const existing = await db.query(
      `SELECT * FROM cart WHERE user_id = $1 AND course_id = $2 AND product_type = 'ebook'`,
      [user_id, course_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Ebook already in cart' });
    }

    // Insert ebook into cart
    await db.query(
      `INSERT INTO cart (user_id, course_id, price, payment_status, created_at, updated_at, product_type)
       VALUES ($1, $2, $3, 'pending', NOW(), NOW(), 'ebook')`,
      [user_id, course_id, price]
    );

    res.status(201).json({ message: 'Ebook added to cart successfully' });
  } catch (err) {
    console.error('Error adding ebook to cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get cart items for a user with ebook details
exports.getEbookCartItems = async (req, res) => {
  const user_id = req.params.user_id; // or from auth session

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const result = await db.query(
      `SELECT cart.id, cart.course_id, cart.price, ebooks.title, ebooks.description, ebooks.ebook
       FROM cart
       JOIN ebooks ON cart.course_id = ebooks.id
       WHERE cart.user_id = $1 AND cart.product_type = 'ebook'`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ebook cart items:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a cart item by its ID (same as course)
exports.removeCartItem = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM cart WHERE id = $1', [id]);

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Error removing cart item:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};