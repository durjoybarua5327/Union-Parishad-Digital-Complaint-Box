import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, initDB } from '../db.js';

// Initialize database
initDB();

const router = express.Router();

// File upload configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = './public/uploads';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
  }),
});

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';

// Auth helpers
const generateToken = (user) => {
  // Keep minimal user payload
  const payload = { id: user.id, role: user.role, ward: user.ward };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Try to authenticate; if token present and valid attach req.user, otherwise continue
const tryAuthenticate = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user from DB
    const [rows] = await db.execute('SELECT id, name, email, role, ward FROM users WHERE id = ?', [payload.id]);
    if (rows.length === 0) return next();
    req.user = rows[0];
  } catch (err) {
    // ignore invalid token
  }
  return next();
};

// Require authentication for protected routes
const requireAuth = async (req, res, next) => {
  await tryAuthenticate(req, res, async () => {});
  if (!req.user) {
    return next({ status: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
  }
  next();
};

// Response formatter middleware
router.use((req, res, next) => {
  res.success = (data, message = 'Success') => {
    res.json({
      success: true,
      data,
      message
    });
  };
  next();
});

// --- USERS ---
router.get('/users', async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, name, email, role, ward, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.success(rows, 'Users retrieved successfully');
  } catch (err) {
    next({ status: 500, message: 'Failed to fetch users', code: 'DB_ERROR' });
  }
});

router.post('/users', async (req, res, next) => {
  const { name, email, role, ward } = req.body;

  // Validate input
  if (!name || !email) {
    return next({ status: 400, message: 'Name and email are required', code: 'VALIDATION_ERROR' });
  }

  try {
    const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return next({ status: 409, message: 'Email already registered', code: 'DUPLICATE_EMAIL' });
    }

    const [result] = await db.execute(
      'INSERT INTO users (name, email, role, ward) VALUES (?, ?, ?, ?)',
      [name, email, role || 'CITIZEN', ward || null]
    );

    res.status(201).success(
      { id: result.insertId, name, email, role, ward },
      'User created successfully'
    );
  } catch (err) {
    next({ status: 500, message: 'Failed to create user', code: 'DB_ERROR' });
  }
});

// Register endpoint (creates user with password and returns token)
router.post('/users/register', async (req, res, next) => {
  const { name, email, password, role, ward } = req.body;

  if (!name || !email || !password) {
    return next({ status: 400, message: 'Name, email and password are required', code: 'VALIDATION_ERROR' });
  }

  try {
    const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return next({ status: 409, message: 'Email already registered', code: 'DUPLICATE_EMAIL' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, role, ward) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role || 'CITIZEN', ward || null]
    );

    const user = { id: result.insertId, name, email, role: role || 'CITIZEN', ward: ward || null };
    const token = generateToken(user);

    res.status(201).success({ token, user }, 'User registered successfully');
  } catch (err) {
    next({ status: 500, message: 'Failed to register user', code: 'DB_ERROR' });
  }
});

// Login endpoint
router.post('/users/login', async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next({ status: 400, message: 'Email and password are required', code: 'VALIDATION_ERROR' });
  }

  try {
    const [rows] = await db.execute('SELECT id, name, email, password_hash, role, ward FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return next({ status: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash || '');
    if (!match) {
      return next({ status: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, ward: user.ward };
    const token = generateToken(safeUser);

    res.success({ token, user: safeUser }, 'Login successful');
  } catch (err) {
    next({ status: 500, message: 'Failed to login', code: 'DB_ERROR' });
  }
});

// --- COMPLAINTS ---
router.get('/complaints', tryAuthenticate, async (req, res, next) => {
  const { ward, category, status, userId } = req.query;

  try {
    let query = `
      SELECT c.*, u.name as user_name
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based visibility
    if (req.user) {
      if (req.user.role === 'CITIZEN') {
        query += ' AND c.user_id = ?';
        params.push(req.user.id);
      } else if (req.user.role === 'OFFICER') {
        // Officers see complaints in their ward
        query += ' AND c.ward = ?';
        params.push(req.user.ward);
      }
      // ADMIN sees all
    } else if (userId) {
      // fallback: allow querying by userId if provided
      query += ' AND c.user_id = ?';
      params.push(userId);
    } else {
      // If unauthenticated and no filters, deny listing
      return next({ status: 401, message: 'Authentication required to list complaints', code: 'UNAUTHORIZED' });
    }

    if (ward) {
      query += ' AND c.ward = ?';
      params.push(ward);
    }
    if (category) {
      query += ' AND c.category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await db.execute(query, params);
    res.success(rows, 'Complaints retrieved successfully');
  } catch (err) {
    next({ status: 500, message: 'Failed to fetch complaints', code: 'DB_ERROR' });
  }
});

const validateComplaint = (data) => {
  const errors = [];
  if (!data.title || data.title.length < 5) {
    errors.push('Title must be at least 5 characters long');
  }
  if (!data.description || data.description.length < 20) {
    errors.push('Description must be at least 20 characters long');
  }
  if (!data.category) {
    errors.push('Category is required');
  }
  if (!data.ward || isNaN(data.ward) || data.ward < 1 || data.ward > 12) {
    errors.push('Ward must be a number between 1 and 12');
  }
  if (!data.address) {
    errors.push('Address is required');
  }
  return errors;
};

router.post('/complaints', requireAuth, upload.array('images'), async (req, res, next) => {
  const { title, description, category, ward, address } = req.body;

  // Validate input
  const validationErrors = validateComplaint(req.body);
  if (validationErrors.length > 0) {
    // Clean up uploaded files if any
    if (req.files && req.files.length) {
      for (const f of req.files) {
        try { fs.unlinkSync(f.path); } catch (e) {}
      }
    }
    return next({ 
      status: 400, 
      message: 'Validation failed', 
      code: 'VALIDATION_ERROR',
      details: validationErrors 
    });
  }

  try {
    // Insert complaint
    const [result] = await db.execute(
      `INSERT INTO complaints (
        title, description, category, ward, address, user_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
      [title, description, category, ward, address, req.user.id]
    );

    const complaintId = result.insertId;

    // Process uploaded files (if any)
    if (req.files && req.files.length) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          // skip invalid types and remove file
          try { fs.unlinkSync(file.path); } catch (e) {}
          continue;
        }

        const fileUrl = `/uploads/${file.filename}`;
        await db.execute(
          'INSERT INTO complaint_attachments (complaint_id, file_url, uploaded_at) VALUES (?, ?, NOW())',
          [complaintId, fileUrl]
        );
      }
    }

    res.status(201).success({
      id: complaintId,
      title,
      description,
      category,
      ward,
      address,
      userId: req.user.id,
      status: 'PENDING',
      created_at: new Date()
    }, 'Complaint submitted successfully');
  } catch (err) {
    // Clean up uploaded files
    if (req.files && req.files.length) {
      for (const f of req.files) {
        try { fs.unlinkSync(f.path); } catch (e) {}
      }
    }
    next({ 
      status: 500, 
      message: 'Failed to submit complaint', 
      code: 'DB_ERROR' 
    });
  }
});

// --- COMMENTS ---
router.get('/comments', async (req, res, next) => {
  const { complaintId } = req.query;

  if (!complaintId) {
    return next({ 
      status: 400, 
      message: 'Complaint ID is required', 
      code: 'MISSING_COMPLAINT_ID' 
    });
  }

  try {
    const [rows] = await db.execute(`
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.complaint_id = ?
      ORDER BY c.created_at DESC
    `, [complaintId]);
    
    res.success(rows, 'Comments retrieved successfully');
  } catch (err) {
    next({ 
      status: 500, 
      message: 'Failed to fetch comments', 
      code: 'DB_ERROR' 
    });
  }
});

router.post('/comments', async (req, res, next) => {
  const { content, userId, complaintId } = req.body;

  // Validate input
  if (!content || content.trim().length < 1) {
    return next({ 
      status: 400, 
      message: 'Comment content is required', 
      code: 'VALIDATION_ERROR' 
    });
  }

  if (!userId || !complaintId) {
    return next({ 
      status: 400, 
      message: 'User ID and Complaint ID are required', 
      code: 'VALIDATION_ERROR' 
    });
  }

  try {
    // Check if complaint exists
    const [complaint] = await db.execute(
      'SELECT id FROM complaints WHERE id = ?',
      [complaintId]
    );

    if (complaint.length === 0) {
      return next({ 
        status: 404, 
        message: 'Complaint not found', 
        code: 'COMPLAINT_NOT_FOUND' 
      });
    }

    const [result] = await db.execute(`
      INSERT INTO comments (
        content, user_id, complaint_id, created_at
      ) VALUES (?, ?, ?, NOW())
    `, [content, userId, complaintId]);

    // Fetch the created comment with user details
    const [newComment] = await db.execute(`
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).success(
      newComment[0],
      'Comment added successfully'
    );
  } catch (err) {
    next({ 
      status: err.status || 500, 
      message: err.message || 'Failed to add comment', 
      code: err.code || 'DB_ERROR' 
    });
  }
});

export default router;