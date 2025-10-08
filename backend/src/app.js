// backend/src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const db = require('./db');
const PORT = process.env.PORT || 5000;

// ✅ Correct CORS configuration — place it here, before routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/thumbnails', express.static(path.join(__dirname, '../uploads/thumbnails')));

// Routes
const userRoutes = require('./routes/userRoutes');
const ebookRoutes = require('./routes/ebookRoutes');
const courseRoutes = require('./routes/courseRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const courseModulesRoutes = require('./routes/courseModules');
const paymentRoutes = require('./routes/paymentRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const angelbrokingRoutes = require("./routes/angelbrokingRoutes");
const packageRoutes = require('./routes/packageRoutes');
const packageIncludesRoutes = require('./routes/packageIncludesRoutes');
const packageFaqRoutes = require('./routes/packageFaqRoutes');
const purchaseRoutes = require('./routes/packagePurchaseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const couponRoutes = require('./routes/couponRoutes');
// Other route imports
const cartRoutes = require('./routes/cartRoutes');
const taxesRoutes = require('./routes/taxesRoutes');
const packageEditRoutes = require('./routes/packageEditRoutes');
const blogRoutes = require('./routes/blogRoutes');
const commentRoutes = require('./routes/commentRoutes');
const customCouponRoutes = require('./routes/customCouponRoutes');
const purchaseCustomRoutes = require('./routes/purchaseRoutes');
const contentRoutes = require('./routes/contentRoutes');
const screenerContentRoutes = require('./routes/screenerContentRoutes');
const faqRoutes = require('./routes/faqRoutes');


// Default route
app.get('/', (req, res) => {
  res.send('Market Masetroo Backend Running...');
});

// Register routes
app.use('/api/users', userRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/course-modules', courseModulesRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use("/api/angelbroking", angelbrokingRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/package-includes', packageIncludesRoutes);
app.use('/api/package-faqs', packageFaqRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/admin-login', adminRoutes);  // Changed path
app.use('/api', couponRoutes); // Mount route
// Mount the route
app.use('/api/cart', cartRoutes);
app.use('/api/taxes', taxesRoutes);
app.use('/api/packages', packageEditRoutes);

app.use('/api/comments', commentRoutes);
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/custom-coupons', customCouponRoutes);
app.use('/api/purchases', purchaseCustomRoutes);
// Routes
app.use('/content', contentRoutes);
app.use('/uploads/content', express.static(path.join(__dirname, 'uploads/content')));
app.use('/api/screener-content', screenerContentRoutes);


// Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Serve invoices from /uploads/invoices
app.use('/invoices', express.static(path.join(__dirname, 'uploads', 'invoices')));
// Routes
app.use('/api', blogRoutes);
// Route mounting
app.use('/api/faq', faqRoutes); // Base route for FAQ-related endpoints

// Optional: Root endpoint
// app.get('/', (req, res) => {
//   res.send('FAQ API is running...');
// });


 // Admin login

// Start server
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});