import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    let decoded;
    try {
      // Decode and verify the token
      decoded = jwt.decode(token, { complete: true });
      
      if (!decoded?.payload) {
        console.error('No payload in token');
        return res.status(401).json({ error: 'Invalid token structure' });
      }

      // For Clerk tokens, we need these specific claims
      const { sub, email, azp } = decoded.payload;
      
      if (!sub || !email) {
        console.error('Missing required claims:', decoded.payload);
        return res.status(401).json({ 
          error: 'Invalid token claims',
          details: 'Token missing required information'
        });
      }

      // Store these in the decoded object for later use
      decoded = {
        sub,
        email,
        azp
      };

      console.log('Valid token decoded:', { 
        sub: decoded.sub, 
        email: decoded.email,
        azp: decoded.azp 
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ 
        error: 'Invalid token',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // First try to find user by clerk_user_id (most reliable)
    let [user] = await query(
      'SELECT id, email, full_name, role, ward_no, clerk_user_id FROM users WHERE clerk_user_id = ?',
      [decoded.sub]
    );

    // If not found by clerk_user_id, try email
    if (!user) {
      [user] = await query(
        'SELECT id, email, full_name, role, ward_no, clerk_user_id FROM users WHERE email = ?',
        [decoded.email]
      );

      if (user) {
        // User found by email but clerk_user_id doesn't match, update it
        await query(
          'UPDATE users SET clerk_user_id = ? WHERE id = ?',
          [decoded.sub, user.id]
        );
        user.clerk_user_id = decoded.sub;
      } else {
        // No user found, create new one
        const userId = require('crypto').randomUUID();
        await query(
          `INSERT INTO users (
            id, 
            email, 
            role, 
            full_name, 
            clerk_user_id
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            decoded.email,
            'citizen',
            decoded.email.split('@')[0], // Default name from email
            decoded.sub
          ]
        );
        
        [user] = await query(
          'SELECT id, email, full_name, role, ward_no, clerk_user_id FROM users WHERE id = ?',
          [userId]
        );
        
        if (!user) {
          throw new Error('Failed to create user');
        }
      }
    }

    req.user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};