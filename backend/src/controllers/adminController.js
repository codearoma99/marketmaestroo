const db = require('../db'); // adjust path as needed

// =========================================
// Admin Login
// =========================================
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminRes = await db.query('SELECT * FROM admin WHERE username = $1', [email]);
    const admin = adminRes.rows[0];

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ✅ Plain-text comparison since passwords aren't hashed
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Omit password before sending response
    const { password: _, ...adminWithoutPassword } = admin;

    res.json({
      message: 'Admin login successful',
      admin: adminWithoutPassword,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Admin login failed', error: err.message });
  }
};