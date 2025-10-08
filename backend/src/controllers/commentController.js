// controllers/commentController.js
const pool = require('../db');

exports.createComment = async (req, res) => {
  const { user_id, product_type, product_id, comment, review } = req.body;

  console.log('➡️ Incoming comment payload:', {
    user_id,
    product_type,
    product_id,
    comment,
    review,
  });

  // ✅ Validate inputs
  if (!user_id || !product_type || !product_id || !review) {
    console.warn('⚠️ Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (review < 1 || review > 5) {
    console.warn('⚠️ Review must be between 1 and 5');
    return res.status(400).json({ message: 'Review must be between 1 and 5' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (user_id, product_type, product_id, comment, review)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, product_type, product_id, comment, review]
    );

    console.log('✅ Comment inserted successfully:', result.rows[0]);

    return res.status(201).json({
      message: 'Comment added successfully',
      comment: result.rows[0],
    });
  } catch (err) {
    console.error('❌ Error inserting comment into database:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// 🟢 New: Get all comments for a product
exports.getCommentsByProduct = async (req, res) => {
  const { productType, productId } = req.params;
  console.log(`Fetching comments for productType="${productType}" productId="${productId}"`);

  try {
    const result = await pool.query(
      `SELECT c.*, u.name
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.product_type = $1 AND c.product_id = $2
       ORDER BY c.created_at DESC`,
      [productType, productId]
    );

    console.log(`Fetched ${result.rows.length} comments.`);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { comment, review } = req.body;

  if (!comment || !review || review < 1 || review > 5) {
    return res.status(400).json({ message: 'Invalid comment or review' });
  }

  try {
    const result = await pool.query(
      `UPDATE comments SET comment = $1, review = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [comment, review, commentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment updated', comment: result.rows[0] });
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM comments WHERE id = $1`,
      [commentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
