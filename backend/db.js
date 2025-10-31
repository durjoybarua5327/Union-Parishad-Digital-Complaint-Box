import mysql from 'mysql2/promise';

const DB_NAME = 'union_parishad';

// Connect to MySQL server without database first
const connectionPromise = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Your MySQL password
});

// Create a pool for queries
export const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: DB_NAME,
});

// Initialize database and tables
export async function initDB() {
  const conn = await connectionPromise;
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.end();

  // USERS (added nid_number and nid_image)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('CITIZEN','OFFICER','ADMIN') DEFAULT 'CITIZEN',
      ward INT,
      nid_number VARCHAR(50) UNIQUE,
      nid_image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // WARDS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS wards (
      id INT PRIMARY KEY,
      name VARCHAR(255),
      officer_id INT,
      FOREIGN KEY (officer_id) REFERENCES users(id)
    )
  `);

  // COMPLAINTS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      category ENUM('ROAD','WATER','ELECTRICITY','GARBAGE','HEALTH','OTHERS'),
      status ENUM('PENDING','IN_REVIEW','RESOLVED') DEFAULT 'PENDING',
      ward INT,
      address VARCHAR(255),
      user_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ward) REFERENCES wards(id)
    )
  `);

  // COMPLAINT ATTACHMENTS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS complaint_attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      complaint_id INT,
      file_url VARCHAR(255),
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    )
  `);

  // COMPLAINT STATUS HISTORY
  await db.execute(`
    CREATE TABLE IF NOT EXISTS complaint_status_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      complaint_id INT,
      status ENUM('PENDING','IN_REVIEW','RESOLVED'),
      changed_by INT,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    )
  `);

  // COMMENTS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      complaint_id INT,
      user_id INT,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // NOTIFICATIONS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      complaint_id INT,
      message TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    )
  `);

  // Add visibility and assignment columns if missing (safe on repeated runs)
  await db.execute(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS visibility ENUM('PUBLIC','PRIVATE') DEFAULT 'PUBLIC'`);
  await db.execute(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_officer_id INT NULL`);
  // Comment visibility: PUBLIC (citizen+officer+admin), PRIVATE (citizen+admin), INTERNAL (officers+admin)
  await db.execute(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS visibility ENUM('PUBLIC','PRIVATE','INTERNAL') DEFAULT 'PUBLIC'`);

  console.log(`Database "${DB_NAME}" and tables are ready.`);
}
