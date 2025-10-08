const pool = require('../db');

// Insert a purchase record after successful Razorpay payment
exports.createPurchase = async (req, res) => {
  const { user_id, course_id, payment_id, product_amount } = req.body;

  if (!user_id || !course_id || !payment_id || !product_amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO purchases (user_id, course_id, product_type, payment_id, product_amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [user_id, course_id, 'course', payment_id, product_amount]
    );

    res.status(201).json({ success: true, purchase: result.rows[0] });
  } catch (err) {
    console.error('Error inserting purchase:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
