import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';

const router = express.Router();

// Middleware to check if user is an officer
router.use(authenticateToken);
router.use(checkRole('officer'));

// Get all complaints for the officer view
router.get('/assigned', async (req, res) => {
  try {
    const officerId = req.user.id;
    const complaints = await query(`
      SELECT 
        c.*,
        u.full_name as citizen_name,
        u.ward_no as citizen_ward_no,
        CASE 
          WHEN a.officer_id = ? THEN true 
          ELSE false 
        END as is_assigned
      FROM complaints c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN assignments a ON c.id = a.complaint_id AND a.officer_id = ? AND a.status = 'active'
      ORDER BY c.created_at DESC
    `, [officerId, officerId]);

    res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get details of a specific complaint
router.get('/complaints/:id', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const officerId = req.user.id;

    // Check if complaint exists and get assignment info
    const assignment = await query(
      'SELECT a.* FROM assignments a WHERE a.complaint_id = ? AND a.officer_id = ? AND a.status = "active"',
      [complaintId, officerId]
    );

    // Officers can view all complaints but need assignment to update them
    const isAssigned = assignment.length > 0;

    // Get complaint details with comments
    const [complaint] = await query(`
      SELECT c.*, u.full_name as citizen_name
      FROM complaints c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [complaintId]);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Get comments
    const comments = await query(`
      SELECT c.*, u.full_name as user_name, u.role
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.complaint_id = ?
      ORDER BY c.created_at DESC
    `, [complaintId]);

    // Get images
    const images = await query(
      'SELECT * FROM complaint_images WHERE complaint_id = ?',
      [complaintId]
    );

    res.json({
      ...complaint,
      comments,
      images
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update complaint status
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const officerId = req.user.id;
    const { status, notes } = req.body;

    if (!['In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if officer is assigned
    const assignment = await query(
      'SELECT * FROM assignments WHERE complaint_id = ? AND officer_id = ? AND status = "active"',
      [complaintId, officerId]
    );

    if (!assignment.length) {
      return res.status(403).json({ error: 'Not authorized to update this complaint' });
    }

    // Start transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // Update complaint status
      await conn.query(
        'UPDATE complaints SET status = ?, resolution_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, notes || null, complaintId]
      );

      // Add to complaint history
      await conn.query(
        'INSERT INTO complaint_history (complaint_id, officer_id, action_type, new_value, action_notes) VALUES (?, ?, "status_change", ?, ?)',
        [complaintId, officerId, status, notes]
      );

      // If status is Resolved or Closed, update assignment
      if (['Resolved', 'Closed'].includes(status)) {
        await conn.query(
          'UPDATE assignments SET status = "completed", completion_notes = ?, completed_at = CURRENT_TIMESTAMP WHERE complaint_id = ? AND officer_id = ?',
          [notes || null, complaintId, officerId]
        );
      }

      await conn.commit();

      // Get updated complaint data
      const [updatedComplaint] = await query(
        'SELECT * FROM complaints WHERE id = ?',
        [complaintId]
      );

      res.json({ success: true, complaint: updatedComplaint });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to complaint
router.post('/complaints/:id/comments', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const officerId = req.user.id;
    const { comment } = req.body;

    if (!comment?.trim()) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Check if officer is assigned
    const assignment = await query(
      'SELECT * FROM assignments WHERE complaint_id = ? AND officer_id = ? AND status = "active"',
      [complaintId, officerId]
    );

    if (!assignment.length) {
      return res.status(403).json({ error: 'Not authorized to comment on this complaint' });
    }

    // Add comment
    await query(
      'INSERT INTO comments (complaint_id, user_id, comment) VALUES (?, ?, ?)',
      [complaintId, officerId, comment]
    );

    // Get all comments for the complaint
    const comments = await query(`
      SELECT c.*, u.full_name as user_name, u.role
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.complaint_id = ?
      ORDER BY c.created_at DESC
    `, [complaintId]);

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request complaint transfer/escalation
router.post('/complaints/:id/transfer', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const officerId = req.user.id;
    const { reason, type } = req.body; // type can be 'transfer' or 'escalation'

    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Transfer reason is required' });
    }

    // Check if officer is assigned
    const assignment = await query(
      'SELECT * FROM assignments WHERE complaint_id = ? AND officer_id = ? AND status = "active"',
      [complaintId, officerId]
    );

    if (!assignment.length) {
      return res.status(403).json({ error: 'Not authorized to transfer this complaint' });
    }

    // Start transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // Update assignment status
      await conn.query(
        'UPDATE assignments SET status = ?, transfer_notes = ? WHERE complaint_id = ? AND officer_id = ?',
        [type === 'escalation' ? 'escalated' : 'transferred', reason, complaintId, officerId]
      );

      // Update complaint status if escalated
      if (type === 'escalation') {
        await conn.query(
          'UPDATE complaints SET status = "Escalated" WHERE id = ?',
          [complaintId]
        );
      }

      // Add to complaint history
      await conn.query(
        'INSERT INTO complaint_history (complaint_id, officer_id, action_type, action_notes) VALUES (?, ?, ?, ?)',
        [complaintId, officerId, type, reason]
      );

      await conn.commit();
      res.json({ success: true });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get officer's stats and metrics
router.get('/stats', async (req, res) => {
  try {
    const officerId = req.user.id;

    const stats = await query(`
      SELECT 
        COUNT(CASE WHEN c.status = 'Pending' THEN 1 END) as pending,
        COUNT(CASE WHEN c.status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN c.status = 'Resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN c.status = 'Closed' THEN 1 END) as closed
      FROM complaints c
      INNER JOIN assignments a ON c.id = a.complaint_id
      WHERE a.officer_id = ? AND a.status = 'active'
    `, [officerId]);

    const recentActivity = await query(`
      SELECT action_type, created_at, complaint_id
      FROM complaint_history
      WHERE officer_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [officerId]);

    res.json({ stats: stats[0], recentActivity });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;