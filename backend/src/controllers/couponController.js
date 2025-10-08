// controllers/couponController.js
const pool = require('../db');

// Create Coupon (Already defined before)
exports.createCoupon = async (req, res) => {
    try {
        const {
            code,
            discount_type,
            discount_value,
            minimum_amount,
            usage_limit,
            status
        } = req.body;

        const result = await pool.query(
            `INSERT INTO coupons (coupon_code, discount_type, value, minimum_amount, usage_limit, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [code, discount_type, discount_value, minimum_amount || 0, usage_limit || null, status]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get All Coupons
exports.getAllCoupons = async (req, res) => {
    try {
        const result = await pool.query(`SELECT *, id AS coupon_id, coupon_code AS code, value AS discount_value, created_at AS created_date FROM coupons ORDER BY created_at DESC`);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete Coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM coupons WHERE id = $1`, [id]);
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle Status
exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Get current status
        const result = await pool.query(`SELECT status FROM coupons WHERE id = $1`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        const currentStatus = result.rows[0].status;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        await pool.query(`UPDATE coupons SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newStatus, id]);

        res.json({ success: true, message: 'Status updated', newStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update Coupon
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            code,
            discount_type,
            discount_value,
            minimum_amount,
            usage_limit,
            status
        } = req.body;

        const result = await pool.query(
            `UPDATE coupons
             SET coupon_code = $1,
                 discount_type = $2,
                 value = $3,
                 minimum_amount = $4,
                 usage_limit = $5,
                 status = $6,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [code, discount_type, discount_value, minimum_amount || 0, usage_limit || null, status, id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Apply coupon: decrement use_number_of_times
exports.applyCoupon = async (req, res) => {
  const { coupon_id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE coupons
       SET use_number_of_times = use_number_of_times - 1
       WHERE id = $1 AND use_number_of_times > 0
       RETURNING id, use_number_of_times`,
      [coupon_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Coupon not available or no usages left' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};