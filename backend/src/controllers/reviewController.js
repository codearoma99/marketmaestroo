const pool = require('../db'); // adjust path to your DB connection

// For ebook 
exports.getEbookRatings = async (req, res) => {
  try {
    const { ebookIds } = req.body;

    if (!Array.isArray(ebookIds) || ebookIds.length === 0) {
      return res.status(400).json({ error: 'Invalid ebookIds input' });
    }

    const placeholders = ebookIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT product_id, 
             COUNT(*) AS review_count, 
             ROUND(AVG(review)::numeric, 1) AS avg_rating
      FROM comments
      WHERE product_type = 'ebook' 
        AND review IS NOT NULL
        AND product_id IN (${placeholders})
      GROUP BY product_id;
    `;

    const { rows } = await pool.query(query, ebookIds);

    // Convert array to object for easy lookup
    const result = {};
    rows.forEach(row => {
      result[row.product_id] = {
        avg_rating: parseFloat(row.avg_rating),
        review_count: parseInt(row.review_count),
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching ebook ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// For Course
exports.getCourseRatings = async (req, res) => {
  try {
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ error: 'Invalid courseIds input' });
    }

    const placeholders = courseIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT product_id, 
             COUNT(*) AS review_count, 
             ROUND(AVG(review)::numeric, 1) AS avg_rating
      FROM comments
      WHERE product_type = 'course'
        AND review IS NOT NULL
        AND product_id IN (${placeholders})
      GROUP BY product_id;
    `;

    const { rows } = await pool.query(query, courseIds);

    const result = {};
    rows.forEach(row => {
      result[row.product_id] = {
        avg_rating: parseFloat(row.avg_rating),
        review_count: parseInt(row.review_count),
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching course ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// For Package
exports.getPackageRatings = async (req, res) => {
  try {
    const { packageIds } = req.body;

    if (!Array.isArray(packageIds) || packageIds.length === 0) {
      return res.status(400).json({ error: 'Invalid packageIds input' });
    }

    const placeholders = packageIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT product_id, 
             COUNT(*) AS review_count, 
             ROUND(AVG(review)::numeric, 1) AS avg_rating
      FROM comments
      WHERE product_type = 'package'
        AND review IS NOT NULL
        AND product_id IN (${placeholders})
      GROUP BY product_id;
    `;

    const { rows } = await pool.query(query, packageIds);

    const result = {};
    rows.forEach(row => {
      result[row.product_id] = {
        avg_rating: parseFloat(row.avg_rating),
        review_count: parseInt(row.review_count),
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching package ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


