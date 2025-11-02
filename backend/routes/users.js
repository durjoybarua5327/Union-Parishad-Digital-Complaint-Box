import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'public/uploads/users'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      console.error('No user in request after auth');
      return res.status(401).json({ error: 'Authentication failed' });
    }

    console.log('Authenticated user:', req.user);
    
    const [user] = await query(`
      SELECT id, email, full_name, role, ward_no, phone_number, profile_image, clerk_user_id
      FROM users 
      WHERE id = ?
    `, [req.user.id]);

    if (!user) {
      console.error('User not found in database:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', user);
    
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role || 'citizen', // Default to citizen if role is not set
      wardNo: user.ward_no,
      phoneNumber: user.phone_number,
      profileImage: user.profile_image,
      clerkUserId: user.clerk_user_id
    });
  } catch (error) {
    console.error('Error in /users/me:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update current user profile
router.put('/me', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.user) {
      console.error('No user in request after auth');
      return res.status(401).json({ error: 'Authentication failed' });
    }

    const userId = req.user.id;
    const { fullName, phoneNumber, wardNo } = req.body;
    
    // Input validation
    if (!fullName || fullName.trim().length === 0) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format. Must be 11 digits.' });
    }

    if (wardNo && (isNaN(wardNo) || wardNo < 1 || wardNo > 9)) {
      return res.status(400).json({ error: 'Ward number must be between 1 and 9' });
    }
    
    let updateQuery = `
      UPDATE users 
      SET full_name = ?, phone_number = ?, ward_no = ?
    `;
    let params = [fullName, phoneNumber, wardNo];

    if (req.file) {
      // Delete old profile image if exists
      const [currentUser] = await query('SELECT profile_image FROM users WHERE id = ?', [userId]);
      if (currentUser?.profile_image) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public/uploads/users', currentUser.profile_image);
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error('Error deleting old profile image:', err);
          // Continue with update even if delete fails
        }
      }

      updateQuery += `, profile_image = ?`;
      params.push(req.file.filename);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(userId);

    await query(updateQuery, params);

    // Get updated user data
    const [updatedUser] = await query(`
      SELECT id, email, full_name, role, ward_no, phone_number, profile_image, clerk_user_id
      FROM users 
      WHERE id = ?
    `, [userId]);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        role: updatedUser.role || 'citizen',
        wardNo: updatedUser.ward_no,
        phoneNumber: updatedUser.phone_number,
        profileImage: updatedUser.profile_image,
        clerkUserId: updatedUser.clerk_user_id
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;