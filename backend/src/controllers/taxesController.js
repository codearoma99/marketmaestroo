// controllers/taxesController.js

const db = require('../db'); // assume you have a db setup, e.g. using pg or sequelize

// Using 'pg' client example
// db.query(sql, params) returns a promise

// GET /api/taxes
async function getAllTaxes(req, res) {
  try {
    const result = await db.query('SELECT id, title, percentage, product_type FROM taxes');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching taxes', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/taxes/:id
async function updateTax(req, res) {
  const taxId = req.params.id;
  const { title, percentage } = req.body;

  // Optionally validate product_type or other fields if needed, but since only title/percentage are allowed to change

  if (title == null || percentage == null) {
    return res.status(400).json({ message: 'title and percentage are required' });
  }

  try {
    const result = await db.query(
      `UPDATE taxes
       SET title = $1,
           percentage = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, title, percentage, product_type`
      ,
      [title, percentage, taxId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Tax not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating tax', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/taxes/:productType
async function getTaxesByProductType(req, res) {
  const { productType } = req.params;

  const allowedTypes = ['ebook', 'course', 'package'];
  if (!allowedTypes.includes(productType)) {
    return res.status(400).json({ message: 'Invalid product type' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM taxes WHERE product_type = $1',
      [productType]
    );

    res.status(200).json({
      product_type: productType,
      taxes: result.rows
    });

  } catch (error) {
    console.error('Error fetching taxes:', error);
    res.status(500).json({ message: 'Failed to fetch taxes', error: error.message });
  }
}


module.exports = {
  getAllTaxes,
  updateTax,
  getTaxesByProductType
};