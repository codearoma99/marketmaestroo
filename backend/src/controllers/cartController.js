// backend/src/controllers/cartController.js
const db = require('../db');

// GET /api/cart/count/:userId
exports.getCartItemCount = async (req, res) => {
  const { userId } = req.params;

  // console.log(`Received GET /api/cart/count/${userId}`); // 

  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM cart WHERE user_id = $1',
      [userId]
    );

    const count = parseInt(result.rows[0].count, 10);

    res.status(200).json({ count });
  } catch (err) {
    console.error('Error fetching cart count:', err);
    res.status(500).json({ message: 'Failed to fetch cart count', error: err.message });
  }
};
