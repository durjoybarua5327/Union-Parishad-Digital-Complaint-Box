import { query } from '../../../../backend/db.js';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    try {
      const [complaint] = await query('SELECT * FROM complaints WHERE id = ?', [id]);
      if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
      res.status(200).json(complaint);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch complaint' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { status } = req.body;
      await query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
      const [complaint] = await query('SELECT * FROM complaints WHERE id = ?', [id]);
      if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
      res.status(200).json(complaint);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
