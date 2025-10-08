// backend/src/controllers/testimonialController.js
const db = require('../db');

exports.createTestimonial = async (req, res) => {
  const { name, designation, message } = req.body;

  console.log('Received POST /api/testimonials with data:', req.body);

  try {
    const result = await db.query(
      `INSERT INTO testimonials (name, designation, message) VALUES ($1, $2, $3) RETURNING *`,
      [name, designation, message]
    );

    console.log('Inserted testimonial:', result.rows[0]); // ✅ add this line

    res.status(201).json({ message: 'Testimonial added successfully', testimonial: result.rows[0] });
  } catch (err) {
    console.error('Error inserting testimonial:', err);
    res.status(500).json({ message: 'Failed to add testimonial', error: err.message });
  }
};


// Fetch all testimonials
exports.getAllTestimonials = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM testimonials ORDER BY created_at DESC`);
    res.status(200).json({ message: 'Testimonials fetched successfully', testimonials: result.rows });
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.status(500).json({ message: 'Failed to fetch testimonials', error: err.message });
  }
};

// Update testimonial status
exports.updateTestimonialStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const result = await db.query(
      `UPDATE testimonials SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    res.status(200).json({ message: 'Status updated successfully', testimonial: result.rows[0] });
  } catch (err) {
    console.error('Error updating testimonial status:', err);
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};