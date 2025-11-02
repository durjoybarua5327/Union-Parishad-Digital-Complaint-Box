// server1.js
import express from "express";
import cors from "cors";
import { initDatabase, query } from "./db.js";
import { randomUUID } from "crypto";

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Very simple role-check helper (replace with real auth in prod)
async function getUserByEmail(email) {
  if (!email) return null;
  const [u] = await query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  return u;
}

function requireOfficer(req, res, next) {
  // This example reads ?email= from query or header 'x-user-email'
  const email = req.query.email || req.headers["x-user-email"];
  if (!email) return res.status(401).json({ error: "Email required for auth" });

  getUserByEmail(email)
    .then((user) => {
      if (!user) return res.status(401).json({ error: "User not found" });
      if (user.role !== "officer" && user.role !== "admin") {
        return res.status(403).json({ error: "Requires officer role" });
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Auth check failed" });
    });
}

// List complaints assigned to the currently-authenticated officer
app.get("/api/officer/assigned", requireOfficer, async (req, res) => {
  try {
    const officerId = req.user.id;
    const rows = await query(
      `SELECT a.id AS assignment_id, c.* ,
              (SELECT ci.image_url FROM complaint_images ci WHERE ci.complaint_id = c.id LIMIT 1) AS image_url,
              u.email, u.full_name
       FROM assignments a
       JOIN complaints c ON a.complaint_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE a.officer_id = ?
       ORDER BY a.assigned_at DESC`,
      [officerId]
    );

    const mapped = rows.map((r) => ({
      ...r,
      image_url: r.image_url ? `http://localhost:5000${r.image_url}` : null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("❌ Error fetching assigned complaints:", err);
    res.status(500).json({ error: "Failed to fetch assigned complaints" });
  }
});

// Assign a complaint to an officer (admin/officer allowed)
app.post("/api/officer/assign", requireOfficer, async (req, res) => {
  const { complaint_id, officer_email } = req.body;
  if (!complaint_id || !officer_email) return res.status(400).json({ error: "complaint_id and officer_email required" });

  try {
    // ensure officer exists
    const officer = await getUserByEmail(officer_email);
    if (!officer || officer.role !== "officer") {
      return res.status(400).json({ error: "Invalid officer" });
    }

    // optionally check if already assigned
    const existing = await query("SELECT * FROM assignments WHERE complaint_id = ? AND officer_id = ?", [
      complaint_id,
      officer.id,
    ]);
    if (existing.length > 0) {
      return res.status(200).json({ message: "Already assigned", assignment: existing[0] });
    }

    const result = await query("INSERT INTO assignments (complaint_id, officer_id) VALUES (?, ?)", [
      complaint_id,
      officer.id,
    ]);

    // mark complaint as In Progress (optional)
    await query("UPDATE complaints SET status = ? WHERE id = ?", ["In Progress", complaint_id]);

    const [assignment] = await query("SELECT * FROM assignments WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    console.error("❌ Error assigning complaint:", err);
    res.status(500).json({ error: "Failed to assign complaint" });
  }
});

// Officer updates status for a complaint
app.put("/api/officer/:id/status", requireOfficer, async (req, res) => {
  const complaintId = req.params.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "status is required" });

  const allowed = ["Pending", "In Progress", "Resolved", "Closed"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  try {
    // Optionally: verify that the officer is assigned to this complaint
    const assigned = await query("SELECT * FROM assignments WHERE complaint_id = ? AND officer_id = ?", [
      complaintId,
      req.user.id,
    ]);
    // allow admin to change without assignment; otherwise ensure assigned
    if (req.user.role !== "admin" && assigned.length === 0) {
      return res.status(403).json({ error: "You must be assigned to this complaint to change status" });
    }

    await query("UPDATE complaints SET status = ? WHERE id = ?", [status, complaintId]);

    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [complaintId]);
    res.json({ success: true, complaint });
  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Get complaint detail (for officer view) including comments & images
app.get("/api/officer/complaints/:id", requireOfficer, async (req, res) => {
  const id = req.params.id;
  try {
    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [id]);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const comments = await query(
      `SELECT c.id, c.comment AS content, c.created_at, u.full_name AS user_name
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.complaint_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );
    const images = await query("SELECT image_url FROM complaint_images WHERE complaint_id = ?", [id]);

    res.json({ ...complaint, comments, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
});

// Add a comment (officer)
app.post("/api/officer/complaints/:id/comments", requireOfficer, async (req, res) => {
  const complaintId = req.params.id;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: "comment is required" });

  try {
    await query("INSERT INTO comments (complaint_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())", [
      complaintId,
      req.user.id,
      comment,
    ]);
    const comments = await query(
      `SELECT c.id, c.comment AS content, c.created_at, u.full_name AS user_name
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.complaint_id = ?
       ORDER BY c.created_at ASC`,
      [complaintId]
    );
    res.status(201).json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

const PORT = process.env.OFFICER_PORT || 6000;
initDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`✅ Officer server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Failed to init DB:", err);
    process.exit(1);
  });
