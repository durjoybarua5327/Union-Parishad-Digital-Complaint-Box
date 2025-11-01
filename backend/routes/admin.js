const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Get all officers
router.get('/users/officers', async (req, res) => {
  try {
    const officers = await query(
      'SELECT id, full_name, email FROM users WHERE role = "OFFICER"'
    );
    res.json(officers);
  } catch (err) {
    console.error('Error fetching officers:', err);
    res.status(500).json({ error: 'Failed to fetch officers' });
  }
});

// Assign officer to complaint
router.put('/complaints/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { officerId } = req.body;
  
  try {
    await query(
      'UPDATE complaints SET assigned_officer = ?, status = "IN_REVIEW" WHERE id = ?',
      [officerId, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error assigning officer:', err);
    res.status(500).json({ error: 'Failed to assign officer' });
  }
});

// Get complaints assigned to officer
router.get('/complaints/assigned/:officerId', async (req, res) => {
  const { officerId } = req.params;
  
  try {
    const complaints = await query(
      'SELECT * FROM complaints WHERE assigned_officer = ? ORDER BY created_at DESC',
      [officerId]
    );
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching assigned complaints:', err);
    res.status(500).json({ error: 'Failed to fetch assigned complaints' });
  }
});

// Update complaint status
router.put('/complaints/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    await query(
      'UPDATE complaints SET status = ? WHERE id = ?',
      [status, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating complaint status:', err);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

module.exports = router;