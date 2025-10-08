// backend/src/controllers/packageEditController.js
const db = require('../db');

// PUT /api/packages/:id/edit
exports.updateFullPackage = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    price,
    duration,
    minimum_duration,
    info_single_line,
    includes,
    faqs,
  } = req.body;

  if (!title || !price || !duration || !minimum_duration) {
    return res.status(400).json({ message: 'Missing required package fields' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Update package main info
    await client.query(
      `UPDATE packages SET title = $1, price = $2, duration = $3, minimum_duration = $4, info_single_line = $5 WHERE id = $6`,
      [title, price, duration, minimum_duration, info_single_line, id]
    );

    // 2. Delete old includes
    await client.query(`DELETE FROM packages_include WHERE package_id = $1`, [id]);

    // 3. Insert new includes
    if (Array.isArray(includes)) {
      for (const include of includes) {
        const { title: incTitle, includes: html } = include;
        if (!incTitle || !html) continue;
        await client.query(
          `INSERT INTO packages_include (package_id, title, includes) VALUES ($1, $2, $3)`,
          [id, incTitle.trim(), html.trim()]
        );
      }
    }

    // 4. Delete old FAQs
    await client.query(`DELETE FROM package_faq WHERE package_id = $1`, [id]);

    // 5. Insert new FAQs
    if (Array.isArray(faqs)) {
      for (const faq of faqs) {
        const { question, answer } = faq;
        if (!question || !answer) continue;
        await client.query(
          `INSERT INTO package_faq (package_id, question, answer) VALUES ($1, $2, $3)`,
          [id, question.trim(), answer.trim()]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Package updated successfully' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating package:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};
