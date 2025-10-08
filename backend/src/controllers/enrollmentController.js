const db = require('../db');

// =========================================
// Get All Enrollments with User and Course/Ebook Details
// =========================================
exports.getAllEnrollments = async (req, res) => {
  try {
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
        COALESCE(c.title, e.title) as product_title
      FROM purchases p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN courses c ON p.product_type = 'course' AND p.course_id = c.id
      LEFT JOIN ebooks e ON p.product_type = 'ebook' AND p.course_id = e.id
      ORDER BY p.created_at DESC
    `;

    const result = await db.query(query);
    
    const enrollments = result.rows.map(enrollment => ({
      id: enrollment.id,
      userId: enrollment.user_id,
      userName: enrollment.user_name,
      userEmail: enrollment.user_email,
      courseId: enrollment.course_id,
      courseTitle: enrollment.product_title,
      enrollmentDate: new Date(enrollment.created_at).toLocaleDateString('en-GB'),
      productType: enrollment.product_type,
      amount: `₹${enrollment.product_amount}`,
      paymentId: enrollment.payment_id
    }));

    res.status(200).json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Failed to fetch enrollments', error: error.message });
  }
};

// =========================================
// Get Users for Dropdown
// =========================================
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email FROM users ORDER BY name');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// =========================================
// Get Courses for Dropdown
// =========================================
exports.getCourses = async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, price FROM courses ORDER BY title');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses', error: error.message });
  }
};

// =========================================
// Get Ebooks for Dropdown
// =========================================
exports.getEbooks = async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, price FROM ebooks ORDER BY title');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching ebooks:', error);
    res.status(500).json({ message: 'Failed to fetch ebooks', error: error.message });
  }
};

// =========================================
// Create New Enrollment
// =========================================
exports.createEnrollment = async (req, res) => {
  const { userId, productType, productId, amount } = req.body;

  try {
    // Validate required fields
    if (!userId || !productType || !productId || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if product exists based on type
    if (productType === 'course') {
      const courseCheck = await db.query('SELECT id FROM courses WHERE id = $1', [productId]);
      if (courseCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Course not found' });
      }
    } else if (productType === 'ebook') {
      const ebookCheck = await db.query('SELECT id FROM ebooks WHERE id = $1', [productId]);
      if (ebookCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Ebook not found' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid product type' });
    }

    // Insert enrollment into purchases table
    const result = await db.query(
      `INSERT INTO purchases (user_id, course_id, product_type, payment_id, product_amount, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [userId, productId, productType, 'offline', amount]
    );

    res.status(201).json({
      message: 'Enrollment created successfully',
      enrollmentId: result.rows[0].id
    });

  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ message: 'Failed to create enrollment', error: error.message });
  }
};

// =========================================
// Delete Enrollment
// =========================================
exports.deleteEnrollment = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM purchases WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.status(200).json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ message: 'Failed to delete enrollment', error: error.message });
  }
};

// =========================================
// Update Enrollment
// =========================================
exports.updateEnrollment = async (req, res) => {
  const { id } = req.params;
  const { userId, productType, productId, amount } = req.body;

  try {
    // Validate fields
    if (!userId || !productType || !productId || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Update record
    const result = await db.query(
      `UPDATE purchases 
       SET user_id = $1, course_id = $2, product_type = $3, product_amount = $4
       WHERE id = $5
       RETURNING id`,
      [userId, productId, productType, amount, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.status(200).json({ message: 'Enrollment updated successfully' });

  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ message: 'Failed to update enrollment', error: error.message });
  }
};
