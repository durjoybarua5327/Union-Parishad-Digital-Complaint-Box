// backend/server.js
import nextConnect from 'next-connect';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { db, initDB } from './db';

initDB(); // Initialize DB

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Multer setup
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

// Create handler
const handler = nextConnect();

// Enable CORS
handler.use(cors({
  origin: 'http://localhost:3000', // frontend URL
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true,
}));

// Parse JSON bodies
handler.use((req, res, next) => {
  if (!['GET','DELETE'].includes(req.method)) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
      next();
    });
  } else next();
});

// Format response
handler.use((req, res, next) => {
  res.success = (data, message = 'Success') => res.json({ success: true, message, data });
  next();
});

// Error handler
handler.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: { message: err.message || 'Internal server error', code: err.code || 'INTERNAL_ERROR' },
  });
});

// ------------------- ROLE MIDDLEWARE -------------------
const requireRole = (roles = []) => (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ------------------- AUTH -------------------
// Register
handler.post('/api/users/register', upload.single('nid_image'), async (req, res) => {
  const { name, email, password, role, ward, nid_number } = req.body;
  if (!name || !email || !password || !nid_number || !req.file)
    return res.status(400).json({ success: false, message: 'All fields required including NID' });

  const [existing] = await db.execute('SELECT id FROM users WHERE email=? OR nid_number=?', [email, nid_number]);
  if (existing.length > 0) return res.status(409).json({ success: false, message: 'Email or NID already exists' });

  const hash = await bcrypt.hash(password, 10);

  const [result] = await db.execute(
    'INSERT INTO users (name,email,password_hash,role,ward,nid_number,nid_image) VALUES (?,?,?,?,?,?,?)',
    [name, email, hash, role || 'CITIZEN', ward || null, nid_number, `/uploads/${req.file.filename}`]
  );

  res.status(201).success({ id: result.insertId, name, email, role, ward, nid_number }, 'User registered');
});

// Login
handler.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email & password required' });

  const [users] = await db.execute('SELECT * FROM users WHERE email=?', [email]);
  if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role, ward: user.ward }, JWT_SECRET, { expiresIn: '7d' });
  res.success({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, ward: user.ward } }, 'Login successful');
});

// ------------------- COMPLAINTS -------------------
// Submit complaint
handler.post('/api/complaints', requireRole(['CITIZEN']), upload.array('images', 5), async (req, res) => {
  const { title, description, category, ward, address } = req.body;
  const userId = req.user.id;
  if (!title || !description || !category || !ward || !address) return res.status(400).json({ success: false, message: 'Missing fields' });

  const [complaint] = await db.execute(
    'INSERT INTO complaints (title,description,category,ward,address,user_id) VALUES (?,?,?,?,?,?)',
    [title, description, category, ward, address, userId]
  );

  if (req.files) {
    for (const file of req.files) {
      await db.execute('INSERT INTO complaint_attachments (complaint_id,file_url) VALUES (?,?)', [complaint.insertId, `/uploads/${file.filename}`]);
    }
  }

  res.status(201).success({ id: complaint.insertId }, 'Complaint submitted');
});

// Update complaint status
handler.post('/api/complaints/status', requireRole(['OFFICER','ADMIN']), async (req, res) => {
  const { complaintId, status } = req.body;
  if (!complaintId || !status) return res.status(400).json({ success: false, message: 'Missing fields' });

  const changedBy = req.user.id;
  await db.execute('UPDATE complaints SET status=? WHERE id=?', [status, complaintId]);
  await db.execute('INSERT INTO complaint_status_history (complaint_id,status,changed_by) VALUES (?,?,?)', [complaintId, status, changedBy]);

  res.success(null, 'Status updated');
});

// Add comment
handler.post('/api/comments', requireRole(['CITIZEN','OFFICER','ADMIN']), async (req, res) => {
  const { complaintId, content } = req.body;
  const userId = req.user.id;
  if (!complaintId || !content) return res.status(400).json({ success: false, message: 'Missing fields' });

  const [comment] = await db.execute('INSERT INTO comments (complaint_id,user_id,content) VALUES (?,?,?)', [complaintId, userId, content]);
  res.status(201).success({ id: comment.insertId }, 'Comment added');
});

// Fetch complaints (role-based)
handler.get('/api/complaints', requireRole(['CITIZEN','OFFICER','ADMIN']), async (req, res) => {
  const { category, status } = req.query;
  let query = 'SELECT c.*, u.name as user_name FROM complaints c LEFT JOIN users u ON c.user_id=u.id WHERE 1=1';
  const params = [];

  if (req.user.role === 'CITIZEN') { query += ' AND c.user_id=?'; params.push(req.user.id); }
  if (req.user.role === 'OFFICER') { query += ' AND c.ward IN (SELECT id FROM wards WHERE officer_id=?)'; params.push(req.user.id); }

  if (category) { query += ' AND c.category=?'; params.push(category); }
  if (status) { query += ' AND c.status=?'; params.push(status); }

  query += ' ORDER BY c.created_at DESC';
  const [rows] = await db.execute(query, params);
  res.success(rows, 'Complaints retrieved');
});

// Notifications
handler.get('/api/notifications/:userId', requireRole(['CITIZEN','OFFICER','ADMIN']), async (req, res) => {
  const { userId } = req.query;
  const [rows] = await db.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC', [userId]);
  res.success(rows, 'Notifications fetched');
});

export default handler;
