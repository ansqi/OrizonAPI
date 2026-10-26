require('dotenv').config()
const mysql = require('mysql2/promise');

// Creiamo il pool di connessioni
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user:  process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10, // Massimo 10 connessioni simultanee
  queueLimit: 0
});
module.exports = { pool };