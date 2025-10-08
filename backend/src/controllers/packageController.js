// backend/src/controllers/packageController.js
const db = require('../db');

// Create a new package
exports.createPackage = async (req, res) => {
  const {
    title,
    price,
    duration,
    minimum_duration,
    info_single_line,
  } = req.body;

  // Basic validation
  if (!title || !price || !duration || !minimum_duration) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await db.query(
      `INSERT INTO packages (title, price, duration, minimum_duration, info_single_line)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, price, duration, minimum_duration, info_single_line]
    );

    res.status(201).json({
      message: 'Package created successfully',
      package: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating package:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// Get all packages
exports.getAllPackages = async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, info_single_line, price FROM packages ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// controllers/packageController.js
exports.getPackageTitle = async (req, res) => {
  console.log("⚠️ getPackageTitle route was hit with id:", req.params.id);

  const { id } = req.params;

  try {
    const result = await db.query('SELECT title FROM packages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching package title:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPackageIncludes = async (req, res) => {
  const { id } = req.params;
  console.log(`Fetching includes for package id: ${id}`);

  try {
    const result = await db.query(
      'SELECT title FROM packages_include WHERE package_id = $1 ORDER BY id ASC',
      [id]
    );

    console.log('Includes found:', result.rows);
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching package includes:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPackageDetails = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch package main info
    const packageRes = await db.query('SELECT * FROM packages WHERE id = $1', [id]);
    if (packageRes.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    const packageData = packageRes.rows[0];

    // Fetch includes
    const includesRes = await db.query(
      'SELECT id, title, includes FROM packages_include WHERE package_id = $1 ORDER BY id ASC',
      [id]
    );

    // Fetch FAQs
    const faqsRes = await db.query(
      'SELECT id, question, answer FROM package_faq WHERE package_id = $1 ORDER BY id ASC',
      [id]
    );

    return res.json({
      package: packageData,
      includes: includesRes.rows,
      faqs: faqsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching package details:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Check if user has purchased a specific package
exports.checkPackagePurchase = async (req, res) => {
  console.log("✅ checkPackagePurchase route was hit!");

  const { userId, packageId } = req.query;

  if (!userId || !packageId) {
    return res.status(400).json({ message: "Missing userId or packageId" });
  }

  try {
    console.log('Checking purchase for userId:', userId, 'packageId:', packageId);
    
    // Use $1 and $2 for PostgreSQL
    const result = await db.query(
      'SELECT * FROM packages_purchase WHERE user_id = $1 AND package_id = $2',
      [userId, packageId]
    );

    if (result.rows.length > 0) {
      return res.json({ purchased: true });
    } else {
      return res.json({ purchased: false });
    }
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a package by ID
exports.deletePackage = async (req, res) => {
  const { id } = req.params;

  try {
    // First, check if package exists
    const existing = await db.query('SELECT * FROM packages WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Delete the package
    await db.query('DELETE FROM packages WHERE id = $1', [id]);

    res.status(200).json({ message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Error deleting package:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
