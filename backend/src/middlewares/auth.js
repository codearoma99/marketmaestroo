const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const userResult = await db.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Token is not valid. User not found.' });
    }
    
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

module.exports = auth;