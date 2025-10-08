const db = require('../db');

const faqController = {
  // --- FAQ Categories ---
  getAllCategories: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM faq_categories ORDER BY id DESC');
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
  },

  createCategory: async (req, res) => {
    try {
      const { title } = req.body;
      const result = await db.query(
        'INSERT INTO faq_categories (title) VALUES ($1) RETURNING *',
        [title]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error creating category:', err);
      res.status(500).json({ success: false, message: 'Error creating category' });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      const result = await db.query(
        'UPDATE faq_categories SET title = $1 WHERE id = $2 RETURNING *',
        [title, id]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error updating category:', err);
      res.status(500).json({ success: false, message: 'Error updating category' });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM faq_categories WHERE id = $1', [id]);
      res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
      console.error('Error deleting category:', err);
      res.status(500).json({ success: false, message: 'Error deleting category' });
    }
  },

  // --- FAQ Items ---
  getAllFaqItems: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT f.*, c.title AS category_title 
        FROM faq_items f
        JOIN faq_categories c ON f.category_id = c.id
        ORDER BY f.id DESC
      `);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error fetching faq items:', err);
      res.status(500).json({ success: false, message: 'Error fetching faq items' });
    }
  },

  createFaqItem: async (req, res) => {
    try {
      const { category_id, question, answer } = req.body;
      const result = await db.query(
        'INSERT INTO faq_items (category_id, question, answer) VALUES ($1, $2, $3) RETURNING *',
        [category_id, question, answer]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error creating faq item:', err);
      res.status(500).json({ success: false, message: 'Error creating faq item' });
    }
  },

  updateFaqItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { category_id, question, answer } = req.body;
      const result = await db.query(
        'UPDATE faq_items SET category_id = $1, question = $2, answer = $3 WHERE id = $4 RETURNING *',
        [category_id, question, answer, id]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error updating faq item:', err);
      res.status(500).json({ success: false, message: 'Error updating faq item' });
    }
  },

  deleteFaqItem: async (req, res) => {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM faq_items WHERE id = $1', [id]);
      res.json({ success: true, message: 'FAQ item deleted' });
    } catch (err) {
      console.error('Error deleting faq item:', err);
      res.status(500).json({ success: false, message: 'Error deleting faq item' });
    }
  },

  createFaqItemsBulk: async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items to insert' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const insertedItems = [];

    for (const item of items) {
      const { category_id, question, answer } = item;
      const result = await client.query(
        'INSERT INTO faq_items (category_id, question, answer) VALUES ($1, $2, $3) RETURNING *',
        [category_id, question, answer]
      );
      insertedItems.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: insertedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in bulk insert:', err);
    res.status(500).json({ success: false, message: 'Error inserting FAQ items in bulk' });
  } finally {
    client.release();
  }
}

};

module.exports = faqController;
