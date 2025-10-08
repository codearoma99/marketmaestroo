const db = require('../db');

// Insert purchase record after payment success
exports.recordPurchase = async (req, res) => {
  const { user_id, package_id, amount } = req.body;

  if (!user_id || !package_id || !amount) {
    console.log("Received purchase payload:", req.body);
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await db.query(
      `INSERT INTO packages_purchase (user_id, package_id, amount, transaction_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, package_id, amount, req.body.transaction_id]
    );

    return res.status(201).json({
      message: 'Purchase recorded successfully',
      purchase: result.rows[0],
    });
  } catch (err) {
    console.error('Error recording purchase:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all purchase records
// Get all purchase records with user and package info
exports.getAllPurchases = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         pp.*, 
         u.name AS user_name, 
         u.mobile AS user_mobile,
         p.title AS package_title
       FROM 
         packages_purchase pp
       LEFT JOIN users u ON pp.user_id = u.id
       LEFT JOIN packages p ON pp.package_id = p.id
       ORDER BY pp.created_at DESC`
    );

    return res.status(200).json({
      message: 'Purchase records fetched successfully',
      purchases: result.rows,
    });
  } catch (err) {
    console.error('Error fetching purchases:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
