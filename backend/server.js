import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { initDatabase, query } from "./db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(
  cors({
    origin: "http://localhost:3000", // Allow Next.js frontend
    credentials: true,
  })
);
app.use(express.json());

// ---------------- IMAGE UPLOAD SETUP ----------------
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------------- DATABASE INIT ----------------
initDatabase().catch((err) => {
  console.error("❌ Database initialization failed:", err);
  process.exit(1);
});

// ---------------- HELPER FUNCTIONS ----------------
async function getUserByEmail(email) {
  if (!email) throw new Error("Email required");
  const [user] = await query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  return user;
}

async function ensureUserExists(email) {
  if (!email) throw new Error("Email required");
  let user = await getUserByEmail(email);
  if (!user) {
    const id = randomUUID();
    await query("INSERT INTO users (id, email) VALUES (?, ?)", [id, email.toLowerCase()]);
    user = await getUserByEmail(email);
    console.log(`🆕 Created new user: ${email}`);
  }
  return user;
}

// ---------------- PROFILE ROUTES ----------------
app.get("/api/profile", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.post("/api/profile", async (req, res) => {
  const { email, full_name, nid_number, phone_number, address, ward_no, date_of_birth } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const lcEmail = email.toLowerCase();

  try {
    let user = await getUserByEmail(lcEmail);

    if (user) {
      // Update
      await query(
        `UPDATE users 
         SET full_name=?, nid_number=?, phone_number=?, address=?, ward_no=?, date_of_birth=? 
         WHERE email=?`,
        [full_name, nid_number, phone_number, address, ward_no, date_of_birth, lcEmail]
      );
    } else {
      // Create new
      await query(
        `INSERT INTO users (id, email, full_name, nid_number, phone_number, address, ward_no, date_of_birth)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), lcEmail, full_name, nid_number, phone_number, address, ward_no, date_of_birth]
      );
    }

    user = await getUserByEmail(lcEmail);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.get("/api/profile/check", async (req, res) => {
  const email = req.query.email?.toLowerCase();
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.json({ exists: false, complete: false });
    }

    const requiredFields = [
      user.full_name,
      user.nid_number,
      user.phone_number,
      user.address,
      user.ward_no,
      user.date_of_birth,
    ];

    const complete = requiredFields.every((f) => f && f.toString().trim() !== "");

    res.json({ exists: true, complete, data: user });
  } catch (err) {
    console.error("❌ Error checking profile:", err);
    res.status(500).json({ error: "Failed to check profile" });
  }
});

// ---------------- CATEGORY ROUTE ----------------
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await query("SELECT * FROM categories ORDER BY name ASC");
    res.status(200).json(categories);
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ---------------- COMPLAINT ROUTES ----------------
app.get("/api/complaints", async (req, res) => {
  try {
    const complaints = await query("SELECT * FROM complaints ORDER BY created_at DESC");
    res.status(200).json(complaints);
  } catch (err) {
    console.error("❌ Error fetching complaints:", err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

app.get("/api/complaints/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [id]);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const comments = await query(
      `SELECT c.id, c.comment AS content, c.created_at, u.full_name AS user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.complaint_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );

    const images = await query("SELECT image_url FROM complaint_images WHERE complaint_id = ?", [id]);

    res.status(200).json({ ...complaint, comments, images });
  } catch (err) {
    console.error("❌ Error fetching complaint details:", err);
    res.status(500).json({ error: "Failed to fetch complaint details" });
  }
});

// ---------------- CREATE COMPLAINT WITH MULTIPLE IMAGES ----------------
app.post("/api/complaints", upload.array("images"), async (req, res) => {
  try {
    const { user_email, title, description, category, ward_no, visibility, status } = req.body;
    if (!user_email) return res.status(400).json({ error: "User email required" });

    const user = await getUserByEmail(user_email);
    if (!user) return res.status(400).json({ error: "User not found in DB" });

    // Insert complaint without images first
    const result = await query(
      `INSERT INTO complaints 
       (user_id, title, description, category, ward_no, visibility, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, title, description, category, ward_no, visibility || "public", status || "Pending"]
    );

    const complaintId = result.insertId;

    // Save multiple images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = `/uploads/${file.filename}`;
        await query(
          "INSERT INTO complaint_images (complaint_id, image_url) VALUES (?, ?)",
          [complaintId, imageUrl]
        );
      }
    }

    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [complaintId]);
    const images = await query("SELECT image_url FROM complaint_images WHERE complaint_id = ?", [complaintId]);

    res.status(201).json({ ...complaint, images });
  } catch (err) {
    console.error("❌ Error creating complaint:", err);
    res.status(500).json({ error: "Failed to create complaint" });
  }
});

// ---------------- COMMENTS ----------------
app.post("/api/complaints/:id/comments", async (req, res) => {
  const complaintId = req.params.id;
  const { user_id, comment } = req.body;

  try {
    await query(
      "INSERT INTO comments (complaint_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())",
      [complaintId, user_id, comment]
    );

    const comments = await query(
      `SELECT c.id, c.comment AS content, c.created_at, u.full_name AS user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.complaint_id=?
       ORDER BY c.created_at ASC`,
      [complaintId]
    );

    res.status(201).json(comments);
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));
