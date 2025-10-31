import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const userId = req.query.user_id || 1;
    try {
      const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  } else if (req.method === 'POST') {
    const { user_id, name, email, password, role, ward_no } = req.body;
    try {
      await query(
        'UPDATE users SET name = ?, email = ?, password = ?, role = ?, ward_no = ? WHERE id = ?',
        [name, email, password, role, ward_no, user_id]
      );
      const [user] = await query('SELECT * FROM users WHERE id = ?', [user_id]);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
