// backend/src/controllers/packageIncludesController.js
const db = require('../db');

// Add multiple package includes
exports.createPackageIncludes = async (req, res) => {
  const { package_id, includes } = req.body;

  if (!package_id || !Array.isArray(includes) || includes.length === 0) {
    return res.status(400).json({ message: 'Missing package_id or includes array' });
  }

  const insertQuery = `
    INSERT INTO packages_include (package_id, title, includes)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  try {
    const inserted = [];

    for (const include of includes) {
      const { title, includes: html } = include;

      if (!title || !html) continue;

      const result = await db.query(insertQuery, [
        package_id,
        title,
        html,
      ]);

      inserted.push(result.rows[0]);
    }

    res.status(201).json({
      message: 'Package includes created successfully!',
      data: inserted,
    });
  } catch (err) {
    console.error('Error inserting package includes:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Fetch package title for given package_id
exports.getPackageTitle = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT title FROM packages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching package title:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
