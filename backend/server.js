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
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads/users")));

// ---------------- IMAGE UPLOAD SETUP ----------------
const uploadDir = path.join(process.cwd(), "public/uploads/users");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads/users")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------------- DATABASE INIT ----------------

// ---------------- UPDATE COMPLAINT ----------------
app.put("/api/complaints/:id", upload.array("images"), async (req, res) => {
  const complaintId = req.params.id;
  const { title, description, category, ward_no, visibility, status } = req.body;
  try {
    await query(
      `UPDATE complaints SET title=?, description=?, category=?, ward_no=?, visibility=?, status=? WHERE id=?`,
      [title, description, category, ward_no, visibility, status, complaintId]
    );
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = `/uploads/${file.filename}`;
        await query("INSERT INTO complaint_images (complaint_id, image_url) VALUES (?, ?)", [
          complaintId,
          imageUrl,
        ]);
      }
    }
    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [complaintId]);
    const images = await query("SELECT image_url FROM complaint_images WHERE complaint_id = ?", [complaintId]);
    res.status(200).json({ ...complaint, images });
  } catch (err) {
    console.error("❌ Error updating complaint:", err);
    res.status(500).json({ error: "Failed to update complaint" });
  }
});
initDatabase().catch((err) => {
  console.error("❌ Database initialization failed:", err);
  process.exit(1);
});
// ---------------- DELETE COMPLAINT ----------------
app.delete("/api/complaints/:id", async (req, res) => {
  const complaintId = req.params.id;

  try {
    // 1️⃣ Fetch associated images so we can delete files from disk
    const images = await query(
      "SELECT image_url FROM complaint_images WHERE complaint_id = ?",
      [complaintId]
    );

    // 2️⃣ Delete images from filesystem
    for (const img of images) {
      const filePath = path.join(process.cwd(), "public", img.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 3️⃣ Delete comments related to the complaint
    await query("DELETE FROM comments WHERE complaint_id = ?", [complaintId]);

    // 4️⃣ Delete image records
    await query("DELETE FROM complaint_images WHERE complaint_id = ?", [complaintId]);

    // 5️⃣ Delete the complaint itself
    await query("DELETE FROM complaints WHERE id = ?", [complaintId]);

    res.status(200).json({ success: true, message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting complaint:", err);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
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

// ---------------- CATEGORY HELPERS ----------------
async function ensureCategoryExists(categoryName) {
  const lcName = categoryName.toLowerCase().trim();
  const [existing] = await query("SELECT * FROM categories WHERE LOWER(name)=?", [lcName]);
  if (!existing) {
    const result = await query("INSERT INTO categories (name) VALUES (?)", [categoryName]);
    return { id: result.insertId, name: categoryName };
  }
  return existing;
}

// ---------------- PROFILE ROUTES ----------------

app.get("/api/profile", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      ...user,
      image_url: user.image_url ? `http://localhost:5000${user.image_url}` : null,
    });
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// POST profile (create/update)
app.post("/api/profile", upload.single("image"), async (req, res) => {
  const { email, full_name, nid_number, phone_number, address, ward_no, date_of_birth } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const lcEmail = email.toLowerCase();
  const imageUrl = req.file ? `/uploads/users/${req.file.filename}` : null;

  try {
    let user = await getUserByEmail(lcEmail);

    if (user) {
      // Update existing user
      const params = [full_name, nid_number, phone_number, address, ward_no, date_of_birth];
      let queryStr = `UPDATE users SET full_name=?, nid_number=?, phone_number=?, address=?, ward_no=?, date_of_birth=?`;
      if (imageUrl) {
        queryStr += `, image_url=?`;
        params.push(imageUrl);
      }
      queryStr += ` WHERE email=?`;
      params.push(lcEmail);
      await query(queryStr, params);
    } else {
      // Create new user
      await query(
        `INSERT INTO users (id, email, full_name, nid_number, phone_number, address, ward_no, date_of_birth, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), lcEmail, full_name, nid_number, phone_number, address, ward_no, date_of_birth, imageUrl]
      );
    }

    user = await getUserByEmail(lcEmail);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        image_url: user.image_url ? `http://localhost:5000${user.image_url}` : null,
      },
    });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Check if profile exists and complete
app.get("/api/profile/check", async (req, res) => {
  const email = req.query.email?.toLowerCase();
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await getUserByEmail(email);
    if (!user) return res.json({ exists: false, complete: false });

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

// ---------------- CATEGORY ROUTES ----------------
// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const results = await query(
      "SELECT * FROM categories ORDER BY name ASC"
    );
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Search categories
app.get("/api/categories/search", async (req, res) => {
  const q = req.query.q?.toLowerCase() || "";
  try {
    const results = await query(
      "SELECT * FROM categories WHERE LOWER(name) LIKE ? ORDER BY name ASC",
      [`%${q}%`]
    );
    res.json(results);
  } catch (err) {
    console.error("❌ Error searching categories:", err);
    res.status(500).json({ error: "Failed to search categories" });
  }
});

// ---------------- COMPLAINT ROUTES ----------------
app.get("/api/complaints", async (req, res) => {
  try {
    const user_email = req.query.user_email?.toLowerCase();
    let complaints;

    if (user_email) {
      // If user_email is provided, show all complaints for that user
      complaints = await query(
        `SELECT c.*, u.email, u.full_name, u.ward_no AS user_ward_no,
          (SELECT ci.image_url FROM complaint_images ci WHERE ci.complaint_id = c.id LIMIT 1) AS image_url
         FROM complaints c
         JOIN users u ON c.user_id = u.id
         WHERE u.email = ?
         ORDER BY c.created_at DESC`,
        [user_email]
      );
    } else {
      // If no user_email, only show public complaints
      complaints = await query(
        `SELECT c.*, u.email, u.full_name, u.ward_no AS user_ward_no,
          (SELECT ci.image_url FROM complaint_images ci WHERE ci.complaint_id = c.id LIMIT 1) AS image_url
         FROM complaints c
         JOIN users u ON c.user_id = u.id
         WHERE c.visibility = 'public'
         ORDER BY c.created_at DESC`
      );
    }

    complaints = complaints.map((c) => ({
      ...c,
      image_url: c.image_url ? `http://localhost:5000${c.image_url}` : null,
    }));

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

    const categoryRecord = await ensureCategoryExists(category);
    const categoryToUse = categoryRecord.name;

    const result = await query(
      `INSERT INTO complaints 
       (user_id, title, description, category, ward_no, visibility, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, title, description, categoryToUse, ward_no, visibility || "public", status || "Pending"]
    );

    const complaintId = result.insertId;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = `/uploads/${file.filename}`;
        await query("INSERT INTO complaint_images (complaint_id, image_url) VALUES (?, ?)", [
          complaintId,
          imageUrl,
        ]);
      }
    }

    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [complaintId]);
    const images = await query("SELECT image_url FROM complaint_images WHERE complaint_id = ?", [
      complaintId,
    ]);

    res.status(201).json({ ...complaint, images });
  } catch (err) {
    console.error("❌ Error creating complaint:", err);
    res.status(500).json({ error: "Failed to create complaint" });
  }
});
app.get("/api/complaints/:id/edit", async (req, res) => {
  const id = req.params.id;
  try {
    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [id]);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const images = await query("SELECT image_url FROM complaint_images WHERE complaint_id = ?", [id]);

    res.status(200).json({ ...complaint, images });
  } catch (err) {
    console.error("❌ Error fetching complaint for edit:", err);
    res.status(500).json({ error: "Failed to fetch complaint for edit" });
  }
});
app.get("/api/complaints/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [complaint] = await query("SELECT * FROM complaints WHERE id = ?", [id]);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const images = await query("SELECT image_url FROM complaint_images WHERE complaint_id = ?", [id]);

    res.status(200).json({ ...complaint, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaint" });
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
