const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    // First check if the user exists and get their current role and clerk_user_id
    const [existingUser] = await query(
      'SELECT role, clerk_user_id, email FROM users WHERE id = ?',
      [userId]
    );

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the user's role in the same row
    await query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    res.json({ 
      message: 'User role updated successfully',
      user: {
        id: userId,
        role,
        email: existingUser.email,
        clerk_user_id: existingUser.clerk_user_id
      }
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

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