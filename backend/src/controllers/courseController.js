// backend/src/controllers/courseController.js
const db = require('../db');

// Fetch all courses with essential info
exports.getAllCourses = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, short_description, timing, level,
              price, thumbnail
       FROM courses
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Fetch detailed data for a single course
exports.getCourseById = async (req, res) => {
  const courseId = req.params.id;
  try {
    const result = await db.query(
      `SELECT id, title, short_description, timing, level,
              course_overview,
              what_you_will_learn,
              requirements,
              course_includes,
              price, thumbnail
       FROM courses
       WHERE id = $1`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const course = result.rows[0];

    // Build instructor data dynamically or fetch from DB if available
    const instructor = {
      name: "Kritika Sharma",
      bio: "Penny Stock Expert with 10+ years experience",
      avatar: `/assets/img/instructor-avatar.png`
    };

    res.json({
      id: course.id,
      title: course.title,
      short_description: course.short_description,
      timing: course.timing,
      level: course.level,
      course_overview: course.course_overview,
      what_you_will_learn: course.what_you_will_learn,
      requirements: course.requirements,
      course_includes: course.course_includes,
      price: course.price,
      thumbnail: `/uploads/thumbnails/${course.thumbnail}`,
      instructor,
      rating: 0,
      students: 0
    });
  } catch (err) {
    console.error('Error fetching course by ID:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Fetch modules associated with a course
exports.getModulesByCourseId = async (req, res) => {
  const courseId = req.params.id;

  try {
    const result = await db.query(
      `SELECT id, title, description, duration, video AS video_filename, video_title, video_thumbnail
       FROM course_modules
       WHERE course_id = $1
       ORDER BY id`,
      [courseId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching course modules:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add new course with its details
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      short_description,
      timing,
      level,
      course_overview,
      what_you_will_learn,
      requirements,
      price,
      course_includes
    } = req.body;

    const thumbnail = req.file ? req.file.filename : null;
    if (!thumbnail) {
      return res.status(400).json({ message: 'Thumbnail file is required' });
    }

    const result = await db.query(
      `INSERT INTO courses
         (title, short_description, timing, level,
          course_overview, what_you_will_learn, requirements,
          price, course_includes, thumbnail, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
       RETURNING id, title`,
      [
        title,
        short_description,
        timing,
        level,
        course_overview,
        what_you_will_learn,
        requirements,
        price,
        course_includes,
        thumbnail
      ]
    );

    // res.status(201).json({
    //   message: 'Course created successfully',
    //   id: result.rows[0].id,
    //   title: result.rows[0].title
    // });

    // Replace the current res.status(201).json() section with:
  res.status(201).json({
    message: 'Course created successfully',
    course: {
      id: result.rows[0].id,
      title: result.rows[0].title
    }
  });

  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update an existing course
exports.updateCourse = async (req, res) => {
  const courseId = req.params.id;
  
  try {
    const {
      title,
      short_description,
      timing,
      level,
      course_overview,
      what_you_will_learn,
      requirements,
      price,
      course_includes
    } = req.body;

    // Check if course exists
    const courseCheck = await db.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let thumbnailFilename = null;
    let updateQuery;
    let queryParams;

    if (req.file) {
      // If a new thumbnail is uploaded
      thumbnailFilename = req.file.filename;
      updateQuery = `
        UPDATE courses 
        SET title = $1, short_description = $2, timing = $3, level = $4,
            course_overview = $5, what_you_will_learn = $6, requirements = $7,
            price = $8, course_includes = $9, thumbnail = $10, updated_at = NOW()
        WHERE id = $11
        RETURNING id, title
      `;
      queryParams = [
        title,
        short_description,
        timing,
        level,
        course_overview,
        what_you_will_learn,
        requirements,
        price,
        course_includes,
        thumbnailFilename,
        courseId
      ];
    } else {
      // If no new thumbnail, keep the existing one
      updateQuery = `
        UPDATE courses 
        SET title = $1, short_description = $2, timing = $3, level = $4,
            course_overview = $5, what_you_will_learn = $6, requirements = $7,
            price = $8, course_includes = $9, updated_at = NOW()
        WHERE id = $10
        RETURNING id, title
      `;
      queryParams = [
        title,
        short_description,
        timing,
        level,
        course_overview,
        what_you_will_learn,
        requirements,
        price,
        course_includes,
        courseId
      ];
    }

    const result = await db.query(updateQuery, queryParams);

    res.json({
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a course by ID
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM courses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// Add course to cart
exports.addToCart = async (req, res) => {
  try {
    const { user_id, course_id, price } = req.body;

    if (!user_id || !course_id || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Optional: check if course is already in cart
    const existing = await db.query(
      `SELECT * FROM cart WHERE user_id = $1 AND course_id = $2`,
      [user_id, course_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Course already in cart' });
    }

    // Insert into cart
    await db.query(
      `INSERT INTO cart (user_id, course_id, price, payment_status, created_at, updated_at, product_type)
       VALUES ($1, $2, $3, 'pending', NOW(), NOW(), 'course')`,
      [user_id, course_id, price]
    );

    res.status(201).json({ message: 'Course added to cart successfully' });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get cart items for a user with course details
exports.getCartItems = async (req, res) => {
  const user_id = req.params.user_id; // or from auth session

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const result = await db.query(
      `SELECT cart.id, cart.course_id, cart.price, courses.title, courses.short_description, courses.thumbnail
       FROM cart
       JOIN courses ON cart.course_id = courses.id
       WHERE cart.user_id = $1 AND cart.product_type = 'course'`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cart items:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a cart item by its ID
exports.removeCartItem = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM cart WHERE id = $1', [id]);

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Error removing cart item:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Check if user has purchased a course
exports.hasUserPurchasedCourse = async (req, res) => {
  const userId = req.headers['x-user-id']; // ✅ from frontend
  const courseId = req.params.courseId;

  if (!userId || !courseId) {
    return res.status(400).json({ message: 'Missing user ID or course ID' });
  }

  try {
    const result = await db.query(
      `SELECT id FROM purchases 
       WHERE user_id = $1 AND course_id = $2 AND product_type = 'course'`,
      [userId, courseId]
    );

    const hasPurchased = result.rows.length > 0;
    res.json({ hasPurchased });
  } catch (err) {
    console.error('Error checking course purchase:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

