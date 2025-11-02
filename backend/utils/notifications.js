import { query } from '../db.js';

export async function createNotification(userId, title, message, type = 'info') {
  try {
    await query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function notifyComplaintUpdate(complaintId, status, officerId) {
  try {
    // Get complaint and user details
    const [complaint] = await query(`
      SELECT c.*, u.id as user_id, u.full_name as user_name, o.full_name as officer_name
      FROM complaints c 
      JOIN users u ON c.user_id = u.id
      JOIN users o ON o.id = ?
      WHERE c.id = ?
    `, [officerId, complaintId]);

    if (!complaint) return;

    // Create notification for the complaint owner
    let message = '';
    switch (status.toLowerCase()) {
      case 'in progress':
        message = `Your complaint "${complaint.title}" is now being processed by Officer ${complaint.officer_name}`;
        break;
      case 'resolved':
        message = `Your complaint "${complaint.title}" has been resolved`;
        break;
      case 'closed':
        message = `Your complaint "${complaint.title}" has been closed`;
        break;
      default:
        message = `Your complaint "${complaint.title}" status has been updated to ${status}`;
    }

    await createNotification(
      complaint.user_id,
      `Complaint Status Updated`,
      message,
      'status_update'
    );
  } catch (error) {
    console.error('Error sending complaint update notification:', error);
  }
}

export async function validateOfficerAccess(officerId, complaintId) {
  try {
    const [assignment] = await query(
      'SELECT * FROM assignments WHERE complaint_id = ? AND officer_id = ? AND status = "active"',
      [complaintId, officerId]
    );
    return !!assignment;
  } catch (error) {
    console.error('Error validating officer access:', error);
    return false;
  }
}