import mysql from "mysql2/promise";

// Create a connection pool for reusability
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDatabase() {
  // 1️⃣ Create database if not exists
  await pool.query(`CREATE DATABASE IF NOT EXISTS union_parishad`);
  await pool.query(`USE union_parishad`);

  console.log('✅ Database "union_parishad" connected.');

  // 2️⃣ Create tables if not exist

  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      full_name VARCHAR(100),
      nid_number VARCHAR(20),
      phone_number VARCHAR(20),
      address VARCHAR(255),
      ward_no VARCHAR(10),
      date_of_birth DATE,
      email VARCHAR(100) UNIQUE,
      password VARCHAR(255),
      role ENUM('citizen', 'officer', 'admin') DEFAULT 'citizen',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Complaints table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      ward_no VARCHAR(10),
      image_url VARCHAR(255),
      visibility ENUM('public', 'private') DEFAULT 'public',
      status ENUM('Pending', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Comments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      complaint_id INT NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Assignment table (optional: to assign officers to complaints)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      complaint_id INT NOT NULL,
      officer_id VARCHAR(50) NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log("✅ All tables are ready.");
}

// Export a query helper
export async function query(sql, params) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(sql, params);
    return results;
  } finally {
    connection.release();
  }
}
