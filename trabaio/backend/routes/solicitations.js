var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');

// Assume db is initialized elsewhere and passed or required
// For standalone execution, you might need:
// const db = new sqlite3.Database('./database/database.db'); 
// Ensure the database directory exists

// Reference to the database connection (ensure this is correctly initialized in your main app file)
// This example assumes 'db' is accessible in this scope. 
// If running standalone or differently structured, adjust DB connection handling.
let db;

try {
  // Attempt to connect to the database. Adjust the path as needed.
  // Ensure the ./database directory exists or change the path.
  db = new sqlite3.Database('./database/database.db', (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      // Handle error appropriately - maybe exit or use a fallback
    } else {
      console.log('Connected to the SQLite database for solicitations.');
      // Create the solicitations table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS solicitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutor TEXT NOT NULL,
        pet TEXT NOT NULL,
        servico_id INTEGER NOT NULL,
        data_hora TEXT NOT NULL, -- Store as ISO 8601 string (YYYY-MM-DDTHH:MM:SS)
        status TEXT NOT NULL DEFAULT 'Agendado', -- e.g., Agendado, Concluído, Cancelado
        FOREIGN KEY (servico_id) REFERENCES servicos (id)
      )`, (err) => {
        if (err) {
          console.error('Erro ao criar a tabela solicitacoes:', err.message);
        } else {
          console.log('Tabela solicitacoes verificada/criada com sucesso!');
        }
      });
    }
  });
} catch (error) {
    console.error("Failed to initialize database connection for solicitations routes:", error);
    // Fallback or error handling
    // For now, we'll let routes fail if db is not initialized.
}


// --- CRUD Operations for Solicitations --- 

// Criar nova solicitação/agendamento
router.post('/solicitations', (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const { tutor, pet, servico_id, data_hora, status } = req.body;

  // Basic validation
  if (!tutor || !pet || !servico_id || !data_hora) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes: tutor, pet, servico_id, data_hora' });
  }

  // Use provided status or default to 'Agendado'
  const finalStatus = status || 'Agendado';

  db.run('INSERT INTO solicitations (tutor, pet, servico_id, data_hora, status) VALUES (?, ?, ?, ?, ?)',
    [tutor, pet, servico_id, data_hora, finalStatus],
    function(err) { // Use function() to access this.lastID
      if (err) {
        console.error('Erro ao criar a solicitação:', err.message);
        return res.status(500).json({ error: 'Erro interno ao criar a solicitação' });
      }
      // Return the created object including its new ID
      res.status(201).json({ message: 'Solicitação criada com sucesso', id: this.lastID, tutor, pet, servico_id, data_hora, status: finalStatus });
    });
});

// Listar todas as solicitações (potentially with service details)
router.get('/solicitations', (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  // Optional: Join with servicos table to get service name
  const query = `
    SELECT sol.*, ser.nome as servico_nome 
    FROM solicitations sol
    LEFT JOIN servicos ser ON sol.servico_id = ser.id
    ORDER BY sol.data_hora DESC
  `;

  db.all(query, [], (err, solicitations) => {
    if (err) {
      console.error('Erro ao buscar as solicitações:', err.message);
      return res.status(500).json({ error: 'Erro interno ao buscar as solicitações' });
    }
    res.status(200).json(solicitations);
  });
});

// Buscar solicitação por ID (potentially with service details)
router.get('/solicitations/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const { id } = req.params;

  const query = `
    SELECT sol.*, ser.nome as servico_nome 
    FROM solicitations sol
    LEFT JOIN servicos ser ON sol.servico_id = ser.id
    WHERE sol.id = ?
  `;

  db.get(query, [id], (err, solicitations) => {
    if (err) {
      console.error('Erro ao buscar a solicitação:', err.message);
      return res.status(500).json({ error: 'Erro interno ao buscar a solicitação' });
    }
    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    res.status(200).json(solicitations);
  });
});

// Atualizar completamente uma solicitação (PUT)
router.put('/solicitations/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const { id } = req.params;
  const { tutor, pet, servico_id, data_hora, status } = req.body;

  // Basic validation
  if (!tutor || !pet || !servico_id || !data_hora || !status) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios para atualização completa (PUT): tutor, pet, servico_id, data_hora, status' });
  }

  db.run('UPDATE solicitations SET tutor = ?, pet = ?, servico_id = ?, data_hora = ?, status = ? WHERE id = ?',
    [tutor, pet, servico_id, data_hora, status, id],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar a solicitação:', err.message);
        return res.status(500).json({ error: 'Erro interno ao atualizar a solicitação' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada para atualização' });
      }
      res.status(200).json({ message: 'Solicitação atualizada com sucesso' });
    });
});

// Atualização parcial de uma solicitação (PATCH)
router.patch('/solicitations/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização parcial' });
  }

  // Filter out invalid fields (optional but good practice)
  const allowedFields = ['tutor', 'pet', 'servico_id', 'data_hora', 'status'];
  const validKeys = keys.filter(key => allowedFields.includes(key));
  const validValues = validKeys.map(key => fields[key]);

  if (validKeys.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido fornecido para atualização' });
  }

  const setClause = validKeys.map((key) => `${key} = ?`).join(', ');

  db.run(`UPDATE solicitations SET ${setClause} WHERE id = ?`, [...validValues, id], function (err) {
    if (err) {
      console.error('Erro ao atualizar a solicitação parcialmente:', err.message);
      return res.status(500).json({ error: 'Erro interno ao atualizar a solicitação parcialmente' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada para atualização parcial' });
    }
    res.status(200).json({ message: 'Solicitação atualizada parcialmente com sucesso' });
  });
});

// Deletar uma solicitação
router.delete('/solicitations/:id', (req, res) => {
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  const { id } = req.params;
  db.run('DELETE FROM solicitations WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar a solicitação:', err.message);
      return res.status(500).json({ error: 'Erro interno ao deletar a solicitação' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada para deletar' });
    }
    res.status(200).json({ message: 'Solicitação deletada com sucesso' });
  });
});

module.exports = router;

