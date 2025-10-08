// backend/src/controllers/packageFaqController.js
const db = require('../db');

// Create multiple FAQs for a package
exports.createPackageFaqs = async (req, res) => {
  const { package_id, faqs } = req.body;

  if (!package_id || !Array.isArray(faqs) || faqs.length === 0) {
    return res.status(400).json({ message: 'Missing package_id or faqs array' });
  }

  const queryText = `
    INSERT INTO package_faq (package_id, question, answer)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  try {
    const results = [];

    for (const faq of faqs) {
      const { question, answer } = faq;

      if (!question || !answer) continue;

      const result = await db.query(queryText, [
        package_id,
        question,
        answer,
      ]);

      results.push(result.rows[0]);
    }

    return res.status(201).json({
      message: 'Package FAQs created successfully!',
      data: results,
    });
  } catch (err) {
    console.error('Error inserting package FAQs:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Optionally, add fetch FAQs by package_id (if needed)
exports.getPackageFaqs = async (req, res) => {
  const { package_id } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM package_faq WHERE package_id = $1 ORDER BY id ASC',
      [package_id]
    );

    return res.json({ faqs: result.rows });
  } catch (err) {
    console.error('Error fetching package FAQs:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
