const mysql = require('mysql2/promise');

// Creiamo il pool di connessioni
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456Ab',
  database: 'Orizon_db',
  waitForConnections: true,
  connectionLimit: 10, // Massimo 10 connessioni simultanee
  queueLimit: 0
});

function handleDatabaseError(error, res) {
  if (error.code === 'ER_DUP_ENTRY' ) {
    return res.status(409).json({ error: 'Il record esiste già' });
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'Il record è associato ad altri dati' });
  }

  console.error('Errore del database:', error);
  return res.status(500).json({ error: "Errore interno del server" });
}

module.exports = { pool, handleDatabaseError };