// controllers/paymentController.js
const db = require('../db');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const razorpay = new Razorpay({
  key_id: 'rzp_test_R7xdrdgK4j4Z3r',
  key_secret: 'G02i03d5GonfhBa8QqIvqKjK',
});

// Create Razorpay order (existing)
exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Amount is required' });
  }

  try {
    const options = {
      amount: amount, // amount in paise
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 10000)}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};


// New API to record purchase & clear cart after payment success
exports.recordPurchase = async (req, res) => {
  const { userId, purchases, payment_id } = req.body;

  console.log('recordPurchase called with:', { userId, purchases, payment_id });

  if (!userId || !purchases || !payment_id) {
    console.error('Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!Array.isArray(purchases) || purchases.length === 0) {
    console.error('Purchases must be a non-empty array');
    return res.status(400).json({ message: 'Purchases must be a non-empty array' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');
    console.log('DB transaction started');

    const insertPurchaseQuery = `
      INSERT INTO purchases (user_id, course_id, product_type, payment_id, product_amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    for (const [index, item] of purchases.entries()) {
      console.log(`Inserting purchase ${index + 1}:`, item);

      const productId = Number(item.product_id);
      const productAmount = Number(item.price);
      const cartItemId = Number(item.cart_item_id);

      if (
        isNaN(productId) ||
        typeof item.product_type !== 'string' ||
        isNaN(productAmount) ||
        isNaN(cartItemId)
      ) {
        console.error('Invalid purchase item data types:', item);
        throw new Error('Invalid purchase item data types');
      }

      const insertResult = await client.query(insertPurchaseQuery, [
        Number(userId),
        productId,
        item.product_type,
        payment_id,
        productAmount,
      ]);
      console.log(`Inserted purchase ID: ${insertResult.rows[0].id}`);

      const deleteResult = await client.query('DELETE FROM cart WHERE id = $1', [cartItemId]);
      console.log(`Deleted cart item ID: ${cartItemId}, affected rows: ${deleteResult.rowCount}`);

      // ✅ Fetch correct product title based on type
      let titleQuery;
      if (item.product_type === 'course') {
        titleQuery = await client.query('SELECT title FROM courses WHERE id = $1', [productId]);
      } else if (item.product_type === 'ebook') {
        titleQuery = await client.query('SELECT title FROM ebooks WHERE id = $1', [productId]);
      }

      item.title = titleQuery?.rows?.[0]?.title || 'Product';
      console.log(`Fetched title for ${item.product_type} ${productId}:`, item.title);
    }

    console.log('Fetching user details for email');
    const userResult = await client.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      console.error('User not found for ID:', userId);
      throw new Error('User not found');
    }
    console.log('User found:', user);

    //  Ensure invoices directory exists
    const invoicesDir = path.join(__dirname, '../../uploads/invoices');

    if (!fs.existsSync(invoicesDir)) {
      console.log('Invoices directory not found, creating:', invoicesDir);
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const invoicePath = path.join(invoicesDir, `invoice_${payment_id}.pdf`);
    console.log('Generating invoice PDF at:', invoicePath);
    await generateInvoicePDF(user, purchases, payment_id, invoicePath);
    console.log('Invoice PDF generated successfully');

    console.log('Sending purchase email');
    await sendPurchaseEmail(user, purchases, payment_id, invoicePath);
    console.log('Purchase email sent successfully');

    await client.query('COMMIT');
    console.log('DB transaction committed successfully');

    res.status(200).json({ message: 'Purchase recorded, cart cleared, email sent' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error recording purchase:', error.stack || error);
    res.status(500).json({ message: 'Failed to record purchase', error: error.message });
  } finally {
    client.release();
    console.log('DB client released');
  }
};

async function generateInvoicePDF(user, purchases, paymentId, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Colors
    const primaryColor = '#4f46e5';
    const secondaryColor = '#6b7280';
    const accentColor = '#f97316';
    const lightGray = '#f3f4f6';
    const darkGray = '#374151';

    // Helper: Line
    const drawLine = () => {
      doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor(lightGray).stroke();
    };

    // Header: Company Info & Invoice Meta
    doc.fillColor(primaryColor)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Kritika Yadav', 50, 50);

    doc.fillColor(secondaryColor)
      .fontSize(10)
      .font('Helvetica')
      .text('support@marketmaestroo.com', 50, 75);

    doc.fillColor(darkGray)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('INVOICE', 450, 50, { align: 'right' });

    doc.fillColor(secondaryColor)
      .fontSize(10)
      .text(`Invoice #: ${paymentId}`, 450, 75, { align: 'right' })
      .text(`Date: ${new Date().toLocaleDateString()}`, 450, 90, { align: 'right' });

    doc.moveDown(2);
    drawLine();
    doc.moveDown(2);

    // BILL TO + SUMMARY Section in Table-Like Format
    const total = purchases.reduce((sum, item) => sum + Number(item.price), 0);
    doc.fillColor(darkGray).fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50);
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica')
      .text(user.name, 50)
      .text(user.email, 50);

    doc.fillColor(darkGray).fontSize(12).font('Helvetica-Bold').text('INVOICE TOTAL:', 350);
    doc.fillColor(accentColor).fontSize(16).font('Helvetica-Bold').text(`₹${total}`, 450);
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica').text(`${purchases.length} item(s)`, 450);

    doc.moveDown(2);
    drawLine();
    doc.moveDown(1);

    // Purchases Table Header
    doc.fillColor(primaryColor)
      .rect(50, doc.y, 500, 25)
      .fill();

    doc.fillColor('#fff')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('#', 55, doc.y + 8)
      .text('PRODUCT TYPE', 80, doc.y + 8)
      .text('DESCRIPTION', 200, doc.y + 8)
      .text('PRICE', 480, doc.y + 8, { align: 'right' });

    let tableY = doc.y + 25;

    // Purchases Rows
    purchases.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? lightGray : '#fff';

      // Background
      doc.fillColor(rowColor).rect(50, tableY, 500, 20).fill();

      // Text
      doc.fillColor(darkGray).fontSize(10).font('Helvetica')
        .text(index + 1, 55, tableY + 5)
        .text(item.product_type.toUpperCase(), 80, tableY + 5)
        .text(item.title || 'Product', 200, tableY + 5)
        .text(`₹${item.price}`, 480, tableY + 5, { align: 'right' });

      tableY += 20;
    });

    // Final Total Row
    doc.fillColor(lightGray).rect(50, tableY, 500, 25).fill();
    doc.moveTo(50, tableY).lineTo(550, tableY).stroke();

    doc.fillColor(darkGray)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TOTAL:', 350, tableY + 7, { align: 'left' });

    doc.fillColor(accentColor)
      .fontSize(12)
      .text(`₹${total}`, 480, tableY + 7, { align: 'right' });

    doc.moveDown(5);
    drawLine();
    doc.moveDown(1);

    // Footer
    doc.fillColor(primaryColor)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Thank you for your business!');

    doc.moveDown(0.5);
    doc.fillColor(secondaryColor)
      .fontSize(8)
      .font('Helvetica')
      .text('This is a computer-generated invoice and does not require a signature.')
      .text('If you have any questions about this invoice, please contact:')
      .fillColor(primaryColor)
      .text('support@marketmaestroo.com');

    doc.moveDown(3);
    drawLine();

    doc.fillColor(secondaryColor)
      .fontSize(8)
      .text('Kritika Yadav • support@marketmaestroo.com', 50, 780, { align: 'center' })
      .text(`This invoice was generated on ${new Date().toLocaleString()}`, 50, 795, { align: 'center' });

    doc.end();

    writeStream.on('finish', () => {
      console.log('PDF generation finished');
      resolve();
    });

    writeStream.on('error', (err) => {
      console.error('PDF generation error:', err);
      reject(err);
    });
  });
}

async function sendPurchaseEmail(user, purchases, paymentId, invoicePath) {
  console.log('Preparing to send purchase email');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'dhavalpatel9526@gmail.com',
      pass: 'dwtxhlxoemnzroex',
    },
  });

  const productListHTML = purchases.map((item, i) => `
    <tr>
      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eaeaea;">${i + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eaeaea;">${item.product_type.toUpperCase()}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eaeaea;">${item.title || 'Product'}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eaeaea;">₹${item.price}</td>
    </tr>
  `).join('');

  const totalAmount = purchases.reduce((sum, item) => sum + Number(item.price), 0);

  const mailOptions = {
    from: 'Kritika Yadav <dhavalpatel9526@gmail.com>',
    to: user.email,
    subject: `Your Purchase Invoice #${paymentId}`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fc;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f9fc">
            <tr>
                <td align="center" style="padding: 30px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width: 600px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td bgcolor="#4f46e5" style="padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">Kritika Yadav</h1>
                                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 16px;">Purchase Confirmation</p>
                            </td>
                        </tr>
                        
                        <!-- Greeting -->
                        <tr>
                            <td style="padding: 30px 30px 20px;">
                                <h2 style="color: #333; margin: 0 0 10px;">Hi ${user.name},</h2>
                                <p style="color: #666; margin: 0; line-height: 1.6;">Thank you for your purchase! Your order has been confirmed and will be processed shortly. Here are your order details:</p>
                            </td>
                        </tr>
                        
                        <!-- Order Summary -->
                        <tr>
                            <td style="padding: 0 30px 20px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td>
                                            <p style="font-weight: bold; color: #4f46e5; margin: 0;">ORDER #${paymentId}</p>
                                        </td>
                                        <td align="right">
                                            <p style="color: #666; margin: 0;">${new Date().toLocaleDateString()}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Products Table -->
                        <tr>
                            <td style="padding: 0 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                                    <thead>
                                        <tr bgcolor="#f8fafc">
                                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eaeaea; font-weight: 600; color: #64748b;">#</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eaeaea; font-weight: 600; color: #64748b;">Type</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eaeaea; font-weight: 600; color: #64748b;">Title</th>
                                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eaeaea; font-weight: 600; color: #64748b;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${productListHTML}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Total -->
                        <tr>
                            <td style="padding: 20px 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="right">
                                            <p style="font-size: 18px; font-weight: bold; color: #4f46e5; margin: 0;">
                                                Total Paid: <span style="color: #0f172a;">₹${totalAmount}</span>
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Invoice Info -->
                        <tr>
                            <td style="padding: 0 30px 30px;">
                                <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px;">
                                    <p style="color: #475569; margin: 0 0 10px; font-weight: 500;">📎 Your invoice is attached to this email.</p>
                                    <p style="color: #64748b; margin: 0; font-size: 14px;">You can download and save it for your records. The filename is <span style="font-family: monospace;">invoice_${paymentId}.pdf</span></p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td bgcolor="#f8fafc" style="padding: 24px 30px; text-align: center; border-top: 1px solid #eaeaea;">
                                <p style="color: #64748b; margin: 0 0 12px;">Need help with your order?</p>
                                <p style="color: #64748b; margin: 0 0 20px;">Contact us at <a href="mailto:support@marketmaestroo.com" style="color: #4f46e5; text-decoration: none;">support@marketmaestroo.com</a></p>
                                
                                <p style="color: #94a3b8; margin: 0; font-size: 14px;">&copy; ${new Date().getFullYear()} Kritika Yadav. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `,
    attachments: [
      {
        filename: `invoice_${paymentId}.pdf`,
        path: invoicePath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  console.log('Email sent to:', user.email);
}

// Get all purchases for a user
exports.getUserPurchases = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
  // Step 1: Get all user purchases
  const purchasesResult = await db.query(
    'SELECT * FROM purchases WHERE user_id = $1',
    [userId]
  );

  const purchases = purchasesResult.rows;

  // Step 2: For each purchase, attach the product title
  const detailedPurchases = await Promise.all(
    purchases.map(async (purchase) => {
      let titleQuery = '';
      let titleResult;

      if (purchase.product_type === 'ebook') {
        titleQuery = 'SELECT title, description, ebook, thumbnail FROM ebooks WHERE id = $1';
      } else if (purchase.product_type === 'course') {
        titleQuery = 'SELECT title, thumbnail, short_description FROM courses WHERE id = $1';
      }

      if (titleQuery) {
        titleResult = await db.query(titleQuery, [purchase.course_id]);
        purchase.title = titleResult.rows[0]?.title || 'Unknown Title';
        purchase.description = titleResult.rows[0]?.description || '';
        purchase.thumbnail = titleResult.rows[0]?.thumbnail || 'assets/img/courses/default-course.jpg';
        purchase.short_description = titleResult.rows[0]?.short_description || '';
      } else {
        purchase.title = 'Unknown Title';
      }

      return purchase;
    })
  );

  res.status(200).json(detailedPurchases);
} catch (error) {
  console.error('Error fetching purchases:', error);
  res.status(500).json({ message: 'Failed to fetch purchases', error: error.message });
}

};

exports.packageOrder = async (req, res) => {
  const { amount } = req.body; 

  const options = {
    amount,
    currency: 'INR',
    receipt: `receipt_${Date.now()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Fetch all package purchases for a given user ID
exports.getUserPackagePurchases = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const query = `
      SELECT 
        pp.id,
        pp.user_id,
        pp.package_id,
        pp.amount,
        pp.transaction_id,
        pp.created_at,
        p.title,
        p.price,
        p.info_single_line
      FROM packages_purchase pp
      JOIN packages p ON pp.package_id = p.id
      WHERE pp.user_id = $1
    `;

    const { rows } = await db.query(query, [userId]);

    return res.status(200).json(rows);

  } catch (error) {
    console.error('Error fetching package purchases:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};