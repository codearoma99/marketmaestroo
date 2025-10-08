// controllers/paymentController.js
const db = require('../db');

// =========================================
// Get All Payments with User and Product Details
// =========================================
exports.getAllPayments = async (req, res) => {
  try {
    // Query to get payments with user details and product details
    const query = `
      SELECT 
        p.id,
        p.user_id,
        p.course_id,
        p.product_type,
        p.payment_id,
        p.product_amount,
        p.created_at,
        u.name as user_name,
        u.email as user_email,
        COALESCE(c.title, e.title) as product_name,
        COALESCE(c.price, e.price) as product_price
      FROM purchases p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN courses c ON p.product_type = 'course' AND p.course_id = c.id
      LEFT JOIN ebooks e ON p.product_type = 'ebook' AND p.course_id = e.id
      ORDER BY p.created_at DESC
    `;

    const result = await db.query(query);
    
    // Format the data for frontend
    const payments = result.rows.map(payment => ({
      id: `PAY-${payment.id.toString().padStart(4, '0')}`,
      userId: payment.user_id,
      userName: payment.user_name,
      userEmail: payment.user_email,
      courseId: payment.course_id,
      courseName: payment.product_name,
      amount: `₹${payment.product_amount}`,
      paymentDate: new Date(payment.created_at).toLocaleDateString('en-GB'),
      paymentMethod: 'Credit Card', // You might want to store this in your table
      transactionId: payment.payment_id || `TXN${payment.id.toString().padStart(8, '0')}`,
      status: 'Completed', // You might want to store this in your table
      invoice: `INV-${payment.id.toString().padStart(4, '0')}`,
      productType: payment.product_type
    }));

    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
  }
};

// =========================================
// Get Payment Statistics
// =========================================
exports.getPaymentStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(product_amount) as total_revenue,
        COUNT(DISTINCT user_id) as total_customers,
        product_type,
        COUNT(*) as type_count
      FROM purchases 
      GROUP BY product_type
    `;

    const result = await db.query(query);
    
    const stats = {
      totalPayments: parseInt(result.rows.reduce((sum, row) => sum + parseInt(row.total_payments), 0)),
      totalRevenue: result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0),
      totalCustomers: parseInt(result.rows[0]?.total_customers || 0),
      byType: result.rows.map(row => ({
        type: row.product_type,
        count: parseInt(row.type_count)
      }))
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Failed to fetch payment statistics', error: error.message });
  }
};