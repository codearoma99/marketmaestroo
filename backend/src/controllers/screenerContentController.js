const db = require('../db'); // Your database connection

const screenerContentController = {
  // Get screener content by ID (always ID = 1)
  getScreenerContent: async (req, res) => {
    try {
      const query = 'SELECT * FROM screener_page_content WHERE id = 1';
      const result = await db.query(query);

      if (result.rows.length === 0) {
        const insertQuery = `
          INSERT INTO screener_page_content (id) 
          VALUES (1) 
          RETURNING *
        `;
        const insertResult = await db.query(insertQuery);
        return res.json({
          success: true,
          data: insertResult.rows[0],
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching screener content:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching screener content',
      });
    }
  },

  // Update screener content
  updateScreenerContent: async (req, res) => {
    try {
      const {
        // Main
        title, sub_title, micro_title, quote,
        // Disclaimer Section
        dis_title1, dis_text1, dis_title2, dis_text2,
        // Stock Analysis
        sa_title1, sa_text1, sa_title2, sa_text2, sa_title3, sa_text3,
        sa_title4, sa_text4, sa_title5, sa_text5, sa_title6, sa_text6,
        // Screener Different
        sd_box1_title, sd_box1_text, sd_box1_text2, sd_box1_text3,
        sd_box2_title, sd_box2_text, sd_box2_text2, sd_box2_text3,
        sd_box3_title, sd_box3_text, sd_box3_text2, sd_box3_text3,
        // Smart Investing
        si_box1_title, si_box1_text1, si_box1_text2, si_box1_text3,
        si_box2_title, si_box2_text1, si_box2_text2, si_box2_text3,
        si_box3_title, si_box3_text1, si_box3_text2, si_box3_text3,
        // Learn to Read
        lr_box1_title, lr_box1_tag1, lr_box1_text1, lr_box1_tag2, lr_box1_text2, lr_box1_tag3, lr_box1_text3,
        lr_box2_title, lr_box2_tag1, lr_box2_text1, lr_box2_tag2, lr_box2_text2, lr_box2_tag3, lr_box2_text3,
        lr_box3_title, lr_box3_tag1, lr_box3_text1, lr_box3_tag2, lr_box3_text2, lr_box3_tag3, lr_box3_text3,
        lr_box4_title, lr_box4_tag1, lr_box4_text1, lr_box4_tag2, lr_box4_text2, lr_box4_tag3, lr_box4_text3,
        // Kritika Insights
        ki_box1_title, ki_box1_text1, ki_box1_text2, ki_box1_text3,
        ki_box2_title, ki_box2_text1, ki_box2_text2, ki_box2_text3,
        // Important Disclaimers
        id_box1_title, id_box1_text1, id_box1_text2, id_box1_text3, id_box1_text4,
        id_box2_title, id_box2_text1, id_box2_text2, id_box2_text3, id_box2_text4,
        // Join Us
        ju_box1_text1, ju_box1_text2, ju_box1_text3, ju_box1_text4,
        ju_box2_text1, ju_box2_text2, ju_box2_text3, ju_box2_text4,
        // From Kritika Yadav
        fk_quote1, fk_quote2,
        // Screener Capabilities
        sc_box1_text1, sc_box1_text2, sc_box1_text3, sc_box1_text4,
        sc_box2_text1, sc_box2_text2, sc_box2_text3, sc_box2_text4,
      } = req.body;

      const updateQuery = `
        UPDATE screener_page_content SET
          title = $1, sub_title = $2, micro_title = $3, quote = $4,
          dis_title1 = $5, dis_text1 = $6, dis_title2 = $7, dis_text2 = $8,
          sa_title1 = $9, sa_text1 = $10, sa_title2 = $11, sa_text2 = $12,
          sa_title3 = $13, sa_text3 = $14, sa_title4 = $15, sa_text4 = $16,
          sa_title5 = $17, sa_text5 = $18, sa_title6 = $19, sa_text6 = $20,
          sd_box1_title = $21, sd_box1_text = $22, sd_box1_text2 = $23, sd_box1_text3 = $24,
          sd_box2_title = $25, sd_box2_text = $26, sd_box2_text2 = $27, sd_box2_text3 = $28,
          sd_box3_title = $29, sd_box3_text = $30, sd_box3_text2 = $31, sd_box3_text3 = $32,
          si_box1_title = $33, si_box1_text1 = $34, si_box1_text2 = $35, si_box1_text3 = $36,
          si_box2_title = $37, si_box2_text1 = $38, si_box2_text2 = $39, si_box2_text3 = $40,
          si_box3_title = $41, si_box3_text1 = $42, si_box3_text2 = $43, si_box3_text3 = $44,
          lr_box1_title = $45, lr_box1_tag1 = $46, lr_box1_text1 = $47, lr_box1_tag2 = $48, lr_box1_text2 = $49, lr_box1_tag3 = $50, lr_box1_text3 = $51,
          lr_box2_title = $52, lr_box2_tag1 = $53, lr_box2_text1 = $54, lr_box2_tag2 = $55, lr_box2_text2 = $56, lr_box2_tag3 = $57, lr_box2_text3 = $58,
          lr_box3_title = $59, lr_box3_tag1 = $60, lr_box3_text1 = $61, lr_box3_tag2 = $62, lr_box3_text2 = $63, lr_box3_tag3 = $64, lr_box3_text3 = $65,
          lr_box4_title = $66, lr_box4_tag1 = $67, lr_box4_text1 = $68, lr_box4_tag2 = $69, lr_box4_text2 = $70, lr_box4_tag3 = $71, lr_box4_text3 = $72,
          ki_box1_title = $73, ki_box1_text1 = $74, ki_box1_text2 = $75, ki_box1_text3 = $76,
          ki_box2_title = $77, ki_box2_text1 = $78, ki_box2_text2 = $79, ki_box2_text3 = $80,
          id_box1_title = $81, id_box1_text1 = $82, id_box1_text2 = $83, id_box1_text3 = $84, id_box1_text4 = $85,
          id_box2_title = $86, id_box2_text1 = $87, id_box2_text2 = $88, id_box2_text3 = $89, id_box2_text4 = $90,
          ju_box1_text1 = $91, ju_box1_text2 = $92, ju_box1_text3 = $93, ju_box1_text4 = $94,
          ju_box2_text1 = $95, ju_box2_text2 = $96, ju_box2_text3 = $97, ju_box2_text4 = $98,
          fk_quote1 = $99, fk_quote2 = $100,
          sc_box1_text1 = $101, sc_box1_text2 = $102, sc_box1_text3 = $103, sc_box1_text4 = $104,
          sc_box2_text1 = $105, sc_box2_text2 = $106, sc_box2_text3 = $107, sc_box2_text4 = $108
        WHERE id = 1
        RETURNING *
      `;

      const values = [
        title, sub_title, micro_title, quote,
        dis_title1, dis_text1, dis_title2, dis_text2,
        sa_title1, sa_text1, sa_title2, sa_text2, sa_title3, sa_text3,
        sa_title4, sa_text4, sa_title5, sa_text5, sa_title6, sa_text6,
        sd_box1_title, sd_box1_text, sd_box1_text2, sd_box1_text3,
        sd_box2_title, sd_box2_text, sd_box2_text2, sd_box2_text3,
        sd_box3_title, sd_box3_text, sd_box3_text2, sd_box3_text3,
        si_box1_title, si_box1_text1, si_box1_text2, si_box1_text3,
        si_box2_title, si_box2_text1, si_box2_text2, si_box2_text3,
        si_box3_title, si_box3_text1, si_box3_text2, si_box3_text3,
        lr_box1_title, lr_box1_tag1, lr_box1_text1, lr_box1_tag2, lr_box1_text2, lr_box1_tag3, lr_box1_text3,
        lr_box2_title, lr_box2_tag1, lr_box2_text1, lr_box2_tag2, lr_box2_text2, lr_box2_tag3, lr_box2_text3,
        lr_box3_title, lr_box3_tag1, lr_box3_text1, lr_box3_tag2, lr_box3_text2, lr_box3_tag3, lr_box3_text3,
        lr_box4_title, lr_box4_tag1, lr_box4_text1, lr_box4_tag2, lr_box4_text2, lr_box4_tag3, lr_box4_text3,
        ki_box1_title, ki_box1_text1, ki_box1_text2, ki_box1_text3,
        ki_box2_title, ki_box2_text1, ki_box2_text2, ki_box2_text3,
        id_box1_title, id_box1_text1, id_box1_text2, id_box1_text3, id_box1_text4,
        id_box2_title, id_box2_text1, id_box2_text2, id_box2_text3, id_box2_text4,
        ju_box1_text1, ju_box1_text2, ju_box1_text3, ju_box1_text4,
        ju_box2_text1, ju_box2_text2, ju_box2_text3, ju_box2_text4,
        fk_quote1, fk_quote2,
        sc_box1_text1, sc_box1_text2, sc_box1_text3, sc_box1_text4,
        sc_box2_text1, sc_box2_text2, sc_box2_text3, sc_box2_text4,
      ];

      const result = await db.query(updateQuery, values);

      res.json({
        success: true,
        message: 'Screener content updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error updating screener content:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating screener content',
      });
    }
  },
};

module.exports = screenerContentController;