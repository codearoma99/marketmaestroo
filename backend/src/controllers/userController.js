const db = require('../db');
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken'); // Uncomment if using JWT
const saltRounds = 10;

// =========================================
// Register New User
// =========================================
exports.registerUser = async (req, res) => {
  const { name, email, mobile, password } = req.body;

  try {
    // Check if email already exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = await db.query(
      `INSERT INTO users (name, email, mobile, password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, email, mobile`,
      [name, email, mobile, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// =========================================
// Get All Users
// =========================================
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, mobile, created_at FROM users ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// =========================================
// Login Existing User
// =========================================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip; // optional: get user's IP address

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];

    let success = false;

    if (!user) {
      // Log failed attempt
      await db.query(
        `INSERT INTO login_attempts (email, success, ip_address) VALUES ($1, $2, $3)`,
        [email, false, ipAddress]
      );

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Log failed attempt
      await db.query(
        `INSERT INTO login_attempts (email, success, ip_address) VALUES ($1, $2, $3)`,
        [email, false, ipAddress]
      );

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If password is valid
    success = true;

    // Log successful attempt
    await db.query(
      `INSERT INTO login_attempts (email, success, ip_address) VALUES ($1, $2, $3)`,
      [email, true, ipAddress]
    );

    // Send user info (omit password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// =========================================
// Get User by ID
// =========================================
exports.getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query('SELECT id, name, email, mobile, created_at FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

// =========================================
// Update User by ID
// =========================================
exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { name, email, mobile } = req.body;

  try {
    // Optionally check if email already exists for another user
    const existing = await db.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered to another user' });
    }

    const result = await db.query(
      `UPDATE users SET name = $1, email = $2, mobile = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, email, mobile`,
      [name, email, mobile, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// =========================================
// Delete User by ID
// =========================================
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};