const db = require('../db');
const fs = require('fs');
const path = require('path');

exports.createOrUpdateCourseModules = async (req, res) => {
  let transaction;
  try {
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    if (!req.body.modules) {
      return res.status(400).json({ message: 'No modules data provided' });
    }

    let parsedModules = [];
    try {
      parsedModules = JSON.parse(req.body.modules);
    } catch (err) {
      console.error('Error parsing modules JSON:', err);
      return res.status(400).json({ message: 'Invalid JSON in modules data' });
    }

    if (!parsedModules.length) {
      return res.status(400).json({ message: 'No modules provided' });
    }

    const videoFiles = req.files?.['videos'] || [];
    const thumbnailFiles = req.files?.['thumbnails'] || [];

    console.log(`Processing ${parsedModules.length} modules, ${videoFiles.length} videos, ${thumbnailFiles.length} thumbnails`);

    transaction = await db.connect();
    await transaction.query('BEGIN');

    const courseId = parsedModules[0].course_id;

    const courseCheck = await transaction.query(
      'SELECT id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      throw new Error(`Course with ID ${courseId} does not exist`);
    }

    const existingModulesResult = await transaction.query(
      'SELECT id, video, video_thumbnail FROM course_modules WHERE course_id = $1',
      [courseId]
    );
    const existingModuleIds = existingModulesResult.rows.map(row => row.id);
    const incomingModuleIds = parsedModules.map(mod => mod.id).filter(Boolean);

    const modulesToDelete = existingModuleIds.filter(id => !incomingModuleIds.includes(id));

    if (modulesToDelete.length > 0) {
      for (const moduleId of modulesToDelete) {
        const moduleToDelete = existingModulesResult.rows.find(row => row.id === moduleId);
        if (moduleToDelete) {
          if (moduleToDelete.video) {
            const videoPath = path.join('uploads', 'videos', moduleToDelete.video);
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
          }
          if (moduleToDelete.video_thumbnail) {
            const thumbnailPath = path.join('uploads', 'thumbnails', moduleToDelete.video_thumbnail);
            if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
          }
        }
      }

      await transaction.query(
        'DELETE FROM course_modules WHERE id = ANY($1)',
        [modulesToDelete]
      );
      console.log(`Deleted ${modulesToDelete.length} modules`);
    }

    let videoIndex = 0;
    let thumbnailIndex = 0;

    for (let i = 0; i < parsedModules.length; i++) {
      const module = parsedModules[i];
      console.log(`Processing module ${i + 1}:`, module);

      const videoFile = module.isNewVideo ? (videoFiles[videoIndex++] || null) : null;
      const thumbnailFile = module.isNewThumbnail ? (thumbnailFiles[thumbnailIndex++] || null) : null;

      if (module.id) {
        // UPDATE existing module
        const currentModuleResult = await transaction.query(
          'SELECT video, video_thumbnail FROM course_modules WHERE id = $1',
          [module.id]
        );
        const currentModule = currentModuleResult.rows[0];

        const updateFields = [];
        const updateValues = [];
        let paramCount = 0;

        updateFields.push(`title = $${++paramCount}`);
        updateValues.push(module.title);

        updateFields.push(`description = $${++paramCount}`);
        updateValues.push(module.description);

        updateFields.push(`duration = $${++paramCount}`);
        updateValues.push(module.duration);

        updateFields.push(`video_title = $${++paramCount}`);
        updateValues.push(module.video_title);

        if (module.isNewVideo && videoFile) {
          if (currentModule.video) {
            const oldVideoPath = path.join('uploads', 'videos', currentModule.video);
            if (fs.existsSync(oldVideoPath)) fs.unlinkSync(oldVideoPath);
          }
          updateFields.push(`video = $${++paramCount}`);
          updateValues.push(videoFile.filename);
        }

        if (module.isNewThumbnail && thumbnailFile) {
          if (currentModule.video_thumbnail) {
            const oldThumbPath = path.join('uploads', 'thumbnails', currentModule.video_thumbnail);
            if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
          }
          updateFields.push(`video_thumbnail = $${++paramCount}`);
          updateValues.push(thumbnailFile.filename);
        }

        updateFields.push('updated_at = NOW()');

        // Add the final parameter for WHERE clause
        const query = `UPDATE course_modules SET ${updateFields.join(', ')} WHERE id = $${paramCount + 1}`;
        updateValues.push(module.id);

        console.log('Update query:', query, updateValues);
        await transaction.query(query, updateValues);

      } else {
        // INSERT new module
        if (!videoFile) {
          throw new Error(`Video file required for new module: ${module.title}`);
        }

        const result = await transaction.query(
          `INSERT INTO course_modules
          (course_id, title, description, duration, video, video_title, video_thumbnail, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
          [
            module.course_id,
            module.title,
            module.description,
            module.duration,
            videoFile.filename,
            module.video_title,
            thumbnailFile ? thumbnailFile.filename : null
          ]
        );
        console.log(`New module created with ID: ${result.rows[0].id}`);
      }
    }

    await transaction.query('COMMIT');
    console.log('Transaction committed successfully');
    res.status(200).json({ message: 'Modules saved successfully' });

  } catch (err) {
    if (transaction) {
      await transaction.query('ROLLBACK');
      console.log('Transaction rolled back');
    }
    console.error('Error saving course modules:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } finally {
    if (transaction) {
      transaction.release();
    }
  }
};

exports.getModulesByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    console.log(`Fetching modules for course ID: ${courseId}`);
    
    const { rows } = await db.query(
      `SELECT id, course_id, title, description, duration, video, video_title, video_thumbnail
       FROM course_modules WHERE course_id = $1 ORDER BY id`,
      [courseId]
    );
    
    const courseRes = await db.query(`SELECT title FROM courses WHERE id = $1`, [courseId]);
    const courseTitle = courseRes.rows[0]?.title || '';
    
    console.log(`Found ${rows.length} modules for course: ${courseTitle}`);
    res.json({ courseTitle, modules: rows });
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ 
      message: 'Server error fetching modules',
      error: err.message 
    });
  }
};