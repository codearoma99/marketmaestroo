const pool = require('../db');

// Create custom coupon
exports.createCustomCoupon = async (req, res) => {
  try {
    const { product_type, product_id, coupon_code, discount_type, amount, min_amount, status } = req.body;

    const result = await pool.query(
      `INSERT INTO coupon_for_custom 
       (product_type, product_id, coupon_code, discount_type, amount, min_amount, status) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [product_type, product_id, coupon_code, discount_type, amount, min_amount || 0, status || 'active']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating custom coupon:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Fetch all custom coupons
exports.getCustomCoupons = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupon_for_custom ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching custom coupons:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update custom coupon
exports.updateCustomCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_type, product_id, coupon_code, discount_type, amount, min_amount, status } = req.body;

    const result = await pool.query(
      `UPDATE coupon_for_custom 
       SET product_type=$1, product_id=$2, coupon_code=$3, discount_type=$4, 
           amount=$5, min_amount=$6, status=$7
       WHERE id=$8 RETURNING *`,
      [product_type, product_id, coupon_code, discount_type, amount, min_amount || 0, status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Coupon not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating custom coupon:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete custom coupon
exports.deleteCustomCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM coupon_for_custom WHERE id=$1', [id]);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('Error deleting custom coupon:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Fetch all custom coupons with status = 'active-invisible'
exports.getInvisibleActiveCoupons = async (req, res) => {
  console.log('[getInvisibleActiveCoupons] Start fetching coupons with status = active-invisible');
  try {
    const result = await pool.query(
      `SELECT * FROM coupon_for_custom 
       WHERE status = $1 
       ORDER BY created_at DESC`,
      ['active-invisible']
    );
    console.log(`[getInvisibleActiveCoupons] Retrieved ${result.rows.length} coupons`);
    res.json(result.rows);
  } catch (err) {
    console.error('[getInvisibleActiveCoupons] Error fetching active-invisible custom coupons:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get active and active-invisible coupons filtered by product_type AND product_id
exports.getVisibleCustomCoupons = async (req, res) => {
  const { product_type, product_id } = req.query; // expect both from frontend

  console.log('[getVisibleCustomCoupons] product_type:', product_type, 'product_id:', product_id);

  try {
    const result = await pool.query(
      `
      SELECT * FROM coupon_for_custom
      WHERE
        (status = 'active' AND product_type = $1 AND product_id = $2)
        OR (status = 'active-invisible' AND product_type = $1 AND product_id = $2)
      ORDER BY created_at DESC
      `,
      [product_type, product_id]
    );

    console.log('[getVisibleCustomCoupons] fetched coupons:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching custom coupons by product_type and product_id:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};