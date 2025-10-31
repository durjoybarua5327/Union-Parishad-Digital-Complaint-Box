// Get user profile (demo: expects user_id as query param)
import express from 'express';
import cors from 'cors';
import { initDatabase, query } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/profile', async (req, res) => {
  const userId = req.query.user_id || 1; // Default to user_id=1 for demo
  try {
    const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile (demo: expects user_id in body)
app.post('/api/profile', async (req, res) => {
  const { user_id, name, email, password, role, ward_no } = req.body;
  try {
    await query(
      'UPDATE users SET name = ?, email = ?, password = ?, role = ?, ward_no = ? WHERE id = ?',
      [name, email, password, role, ward_no, user_id]
    );
    const [user] = await query('SELECT * FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


// Initialize MySQL database and tables
initDatabase().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

// Get all complaints
app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Get complaint by ID
app.get('/api/complaints/:id', async (req, res) => {
  try {
    const [complaint] = await query('SELECT * FROM complaints WHERE id = ?', [req.params.id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// Add a new complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { user_id, title, description, category, ward_no, image_url, visibility, status } = req.body;
    const result = await query(
      'INSERT INTO complaints (user_id, title, description, category, ward_no, image_url, visibility, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, title, description, category, ward_no, image_url || '', visibility || 'public', status || 'Pending']
    );
    const [complaint] = await query('SELECT * FROM complaints WHERE id = ?', [result.insertId]);
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Update complaint status
app.patch('/api/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE complaints SET status = ? WHERE id = ?', [status, req.params.id]);
    const [complaint] = await query('SELECT * FROM complaints WHERE id = ?', [req.params.id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Add a comment to a complaint
app.post('/api/complaints/:id/comments', async (req, res) => {
  try {
    const { user_id, comment } = req.body;
    await query('INSERT INTO comments (complaint_id, user_id, comment) VALUES (?, ?, ?)', [req.params.id, user_id, comment]);
    const comments = await query('SELECT * FROM comments WHERE complaint_id = ?', [req.params.id]);
    res.status(201).json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
