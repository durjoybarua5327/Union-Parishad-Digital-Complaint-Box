import { query } from '../../../../../backend/db.js';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'POST') {
    try {
      const { user_id, comment } = req.body;
      await query('INSERT INTO comments (complaint_id, user_id, comment) VALUES (?, ?, ?)', [id, user_id, comment]);
      const comments = await query('SELECT * FROM comments WHERE complaint_id = ?', [id]);
      res.status(201).json(comments);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add comment' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
