import express from "express";
import cors from "cors";
import { initDatabase, query } from "./db.js";

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(
  cors({
    origin: "http://localhost:3000", // Next.js frontend
    credentials: true,
  })
);
app.use(express.json());

// ---------------- DATABASE INIT ----------------
initDatabase().catch((err) => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});

// ---------------- PROFILE ROUTES ----------------

// Get user profile (expects user_id as query param)
app.get("/api/profile", async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  try {
    const [user] = await query("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Create or update user profile
app.post("/api/profile", async (req, res) => {
  const { user_id, fullName, nidNumber, phoneNumber, address, ward, dateOfBirth } = req.body;
  if (!user_id) return res.status(400).json({ error: "User ID required" });

  try {
    const [existing] = await query("SELECT * FROM users WHERE id = ?", [user_id]);

    if (existing) {
      // Update
      await query(
        "UPDATE users SET full_name = ?, nid_number = ?, phone_number = ?, address = ?, ward_no = ?, date_of_birth = ? WHERE id = ?",
        [fullName, nidNumber, phoneNumber, address, ward, dateOfBirth, user_id]
      );
    } else {
      // Insert
      await query(
        "INSERT INTO users (id, full_name, nid_number, phone_number, address, ward_no, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user_id, fullName, nidNumber, phoneNumber, address, ward, dateOfBirth]
      );
    }

    const [user] = await query("SELECT * FROM users WHERE id = ?", [user_id]);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ---------------- COMPLAINT ROUTES ----------------

// Get all public complaints
app.get("/api/complaints", async (req, res) => {
  try {
    const complaints = await query(
      "SELECT * FROM complaints WHERE visibility = 'public' ORDER BY created_at DESC"
    );
    res.status(200).json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// Get complaint by ID
app.get("/api/complaints/:id", async (req, res) => {
  try {
    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [req.params.id]);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.status(200).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
});

// Add a new complaint
app.post("/api/complaints", async (req, res) => {
  try {
    const { user_id, title, description, category, ward_no, image_url, visibility, status } =
      req.body;

    const result = await query(
      "INSERT INTO complaints (user_id, title, description, category, ward_no, image_url, visibility, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [user_id, title, description, category, ward_no, image_url || "", visibility || "public", status || "Pending"]
    );

    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [result.insertId]);
    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create complaint" });
  }
});

// Update complaint status
app.patch("/api/complaints/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await query("UPDATE complaints SET status = ? WHERE id = ?", [status, req.params.id]);
    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [req.params.id]);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.status(200).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Add a comment to a complaint
app.post("/api/complaints/:id/comments", async (req, res) => {
  try {
    const { user_id, comment } = req.body;
    await query("INSERT INTO comments (complaint_id, user_id, comment) VALUES (?, ?, ?)", [
      req.params.id,
      user_id,
      comment,
    ]);
    const comments = await query("SELECT * FROM comments WHERE complaint_id = ?", [
      req.params.id,
    ]);
    res.status(201).json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
