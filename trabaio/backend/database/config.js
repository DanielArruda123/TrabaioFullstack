const sqlite3 = require('sqlite3').verbose(); // .verbose() pode dar mais detalhes nos logs
const path = require('path');

// Caminho para o arquivo do banco de dados.
// Como este arquivo (config.js) está em 'trabaio/backend/database/',
// e o 'database.db' também está em 'trabaio/backend/database/',
// o caminho é simplesmente 'database.db' relativo a __dirname.
const dbPath = path.resolve(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados SQLite:", err.message);
  } else {
    console.log("Conectado ao banco de dados SQLite.");
    // Habilitar o modo WAL (Write-Ahead Logging) para melhorar a concorrência
    db.run("PRAGMA journal_mode = WAL;", (walErr) => {
      if (walErr) {
        console.error("Erro ao tentar habilitar WAL:", walErr.message);
      } else {
        console.log("Modo WAL habilitado com sucesso.");
      }
    });
    // Opcional: Aumentar o timeout se o WAL não for suficiente para evitar SQLITE_BUSY
    // db.configure('busyTimeout', 5000); // Espera 5 segundos (5000 ms)
  }
});

module.exports = db;