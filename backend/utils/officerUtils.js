import { query } from '../db.js';

export async function getOfficerStats(officerId) {
  try {
    const [stats] = await query(`
      SELECT 
        COUNT(CASE WHEN c.status = 'Pending' THEN 1 END) as pending,
        COUNT(CASE WHEN c.status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN c.status = 'Resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN c.status = 'Closed' THEN 1 END) as closed,
        COUNT(*) as total,
        AVG(CASE 
          WHEN c.status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, c.created_at, c.updated_at) 
        END) as avg_resolution_time
      FROM complaints c
      INNER JOIN assignments a ON c.id = a.complaint_id
      WHERE a.officer_id = ? AND a.status = 'active'
    `, [officerId]);

    return stats;
  } catch (error) {
    console.error('Error getting officer stats:', error);
    throw error;
  }
}

export async function getOfficerComplaints(officerId, filters = {}) {
  try {
    let query = `
      SELECT 
        c.*,
        u.full_name as citizen_name,
        u.ward_no as citizen_ward,
        a.assigned_at,
        (
          SELECT COUNT(*) 
          FROM comments 
          WHERE complaint_id = c.id
        ) as comment_count,
        (
          SELECT COUNT(*) 
          FROM complaint_images 
          WHERE complaint_id = c.id
        ) as image_count
      FROM complaints c
      INNER JOIN assignments a ON c.id = a.complaint_id
      INNER JOIN users u ON c.user_id = u.id
      WHERE a.officer_id = ? AND a.status = 'active'
    `;

    const params = [officerId];

    if (filters.status && filters.status !== 'all') {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.ward_no) {
      query += ' AND c.ward_no = ?';
      params.push(filters.ward_no);
    }

    if (filters.category) {
      query += ' AND c.category = ?';
      params.push(filters.category);
    }

    query += ' ORDER BY ';
    if (filters.sort_by === 'priority') {
      query += 'c.priority DESC, ';
    }
    query += 'c.created_at DESC';

    const complaints = await query(query, params);
    return complaints;
  } catch (error) {
    console.error('Error getting officer complaints:', error);
    throw error;
  }
}

export async function assignComplaint(complaintId, officerId, assignedBy) {
  try {
    // Start transaction
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // Check if complaint is already assigned
      const [existing] = await conn.query(
        'SELECT * FROM assignments WHERE complaint_id = ? AND status = "active"',
        [complaintId]
      );

      if (existing) {
        // Update existing assignment to transferred
        await conn.query(
          'UPDATE assignments SET status = "transferred" WHERE complaint_id = ? AND status = "active"',
          [complaintId]
        );
      }

      // Create new assignment
      await conn.query(
        'INSERT INTO assignments (complaint_id, officer_id, assigned_by) VALUES (?, ?, ?)',
        [complaintId, officerId, assignedBy]
      );

      // Update complaint status to In Progress if it's Pending
      await conn.query(
        'UPDATE complaints SET status = CASE WHEN status = "Pending" THEN "In Progress" ELSE status END WHERE id = ?',
        [complaintId]
      );

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error assigning complaint:', error);
    throw error;
  }
}

export async function getOfficerMetrics(officerId, timeframe = '30days') {
  try {
    let dateFilter = '';
    switch (timeframe) {
      case '7days':
        dateFilter = 'AND c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30days':
        dateFilter = 'AND c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case '90days':
        dateFilter = 'AND c.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        break;
      default:
        dateFilter = '';
    }

    const [metrics] = await query(`
      SELECT 
        COUNT(*) as total_complaints,
        COUNT(CASE WHEN c.status IN ('Resolved', 'Closed') THEN 1 END) as resolved_complaints,
        ROUND(AVG(CASE 
          WHEN c.status IN ('Resolved', 'Closed') 
          THEN TIMESTAMPDIFF(HOUR, c.created_at, c.updated_at) 
        END)) as avg_resolution_hours,
        COUNT(DISTINCT c.ward_no) as wards_served,
        COUNT(DISTINCT c.category) as categories_handled,
        (
          SELECT COUNT(*) 
          FROM comments com 
          WHERE com.user_id = ? 
          ${dateFilter}
        ) as total_comments
      FROM complaints c
      INNER JOIN assignments a ON c.id = a.complaint_id
      WHERE a.officer_id = ? ${dateFilter}
    `, [officerId, officerId]);

    return metrics;
  } catch (error) {
    console.error('Error getting officer metrics:', error);
    throw error;
  }
}