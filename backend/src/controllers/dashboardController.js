const db = require('../db');

const getDashboardData = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;

    // Helper to generate list of months (YYYY-MM) for the range
    const generateMonthsList = (numMonths) => {
      const list = [];
      const currentDate = new Date();
      for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        list.push(d.toISOString().slice(0, 7)); // 'YYYY-MM'
      }
      return list;
    };

    const monthsList = generateMonthsList(months);

    // Query users grouped by month
    const usersResult = await db.query(
      `SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS total
       FROM users
       WHERE created_at >= NOW() - INTERVAL '${months} months'
       GROUP BY month
       ORDER BY month`
    );

    // Query purchases grouped by month
    const purchasesResult = await db.query(
      `SELECT DATE_TRUNC('month', created_at) AS month,
              SUM(CASE WHEN product_type = 'course' THEN 1 ELSE 0 END) AS course_count,
              SUM(CASE WHEN product_type = 'ebook' THEN 1 ELSE 0 END) AS ebook_count,
              SUM(product_amount) AS total_income
       FROM purchases
       WHERE created_at >= NOW() - INTERVAL '${months} months'
       GROUP BY month
       ORDER BY month`
    );

    // Total stats (overall counts, not filtered by months)
    const stats = {
      totalUsers: parseInt((await db.query(`SELECT COUNT(*) FROM users`)).rows[0].count),
      purchasedCourses: parseInt((await db.query(`SELECT COUNT(*) FROM purchases WHERE product_type = 'course'`)).rows[0].count),
      purchasedEbooks: parseInt((await db.query(`SELECT COUNT(*) FROM purchases WHERE product_type = 'ebook'`)).rows[0].count),
      totalIncome: parseFloat((await db.query(`SELECT COALESCE(SUM(product_amount), 0) FROM purchases`)).rows[0].coalesce),
    };

    // Helper: map db rows by month string (YYYY-MM)
    const mapRowsByMonth = (rows, keys) => {
      const map = {};
      rows.forEach(row => {
        const monthStr = new Date(row.month).toISOString().slice(0, 7);
        if (Array.isArray(keys)) {
          map[monthStr] = {};
          keys.forEach(k => {
            map[monthStr][k] = row[k] !== null ? parseFloat(row[k]) : 0;
          });
        } else {
          map[monthStr] = row[keys] !== null ? parseFloat(row[keys]) : 0;
        }
      });
      return map;
    };

    const usersMap = mapRowsByMonth(usersResult.rows, 'total');
    const purchasesMap = mapRowsByMonth(purchasesResult.rows, ['course_count', 'ebook_count', 'total_income']);

    // Month names for labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build arrays aligned with monthsList, filling missing months with 0
    const users = [];
    const courses = [];
    const ebooks = [];
    const income = [];

    monthsList.forEach(month => {
      users.push(usersMap[month] || 0);

      const p = purchasesMap[month] || {
        course_count: 0,
        ebook_count: 0,
        total_income: 0,
      };
      courses.push(p.course_count);
      ebooks.push(p.ebook_count);
      income.push(p.total_income);
    });

    const monthlyData = {
      labels: monthsList.map(m => {
        const [year, month] = m.split('-');
        return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
      }),
      users,
      courses,
      ebooks,
      income,
    };

    res.status(200).json({ stats, monthlyData });

  } catch (error) {
    console.error('Error in getDashboardData:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { getDashboardData };
