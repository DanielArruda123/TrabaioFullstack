const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const verifyJWT = require('../auth/verify-token');

const db = new sqlite3.Database('./database/database.db');

// Criar a tabela de solicitações, se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS solicitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutor TEXT NOT NULL,
    pet TEXT NOT NULL,
    servico_id INTEGER NOT NULL,
    data_hora TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Agendado',
    FOREIGN KEY (servico_id) REFERENCES servicos (id)
  )
`, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela solicitations:', err.message);
  } else {
    console.log('Tabela solicitations criada com sucesso!');
  }
});

// Criar solicitação
router.post('/', verifyJWT, (req, res) => {
  const { tutor, pet, servico_id, data_hora, status } = req.body;

  if (!tutor || !pet || !servico_id || !data_hora) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes: tutor, pet, servico_id, data_hora' });
  }

  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!isoRegex.test(data_hora)) {
    return res.status(400).json({ error: 'Formato inválido de data_hora. Use YYYY-MM-DDTHH:MM' });
  }

  db.get('SELECT id FROM servicos WHERE id = ?', [servico_id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar serviço' });
    if (!row) return res.status(400).json({ error: 'Serviço não encontrado' });

    const finalStatus = status || 'Agendado';

    db.run(
      'INSERT INTO solicitations (tutor, pet, servico_id, data_hora, status) VALUES (?, ?, ?, ?, ?)',
      [tutor, pet, servico_id, data_hora, finalStatus],
      function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao criar solicitação' });
        res.status(201).json({ message: 'Solicitação criada com sucesso', id: this.lastID });
      }
    );
  });
});

// Listar todas
router.get('/', verifyJWT, (req, res) => {
  const query = `
    SELECT sol.*, ser.nome as servico_nome 
    FROM solicitations sol
    LEFT JOIN servicos ser ON sol.servico_id = ser.id
    ORDER BY sol.data_hora DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar as solicitações' });
    res.status(200).json(rows);
  });
});

// Buscar por ID
router.get('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT sol.*, ser.nome as servico_nome 
    FROM solicitations sol
    LEFT JOIN servicos ser ON sol.servico_id = ser.id
    WHERE sol.id = ?
  `;
  db.get(query, [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar solicitação' });
    if (!row) return res.status(404).json({ error: 'Solicitação não encontrada' });
    res.status(200).json(row);
  });
});

// Atualizar (PUT)
router.put('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  const { tutor, pet, servico_id, data_hora, status } = req.body;

  if (!tutor || !pet || !servico_id || !data_hora || !status) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios para PUT' });
  }

  db.run(
    'UPDATE solicitations SET tutor = ?, pet = ?, servico_id = ?, data_hora = ?, status = ? WHERE id = ?',
    [tutor, pet, servico_id, data_hora, status, id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao atualizar a solicitação' });
      if (this.changes === 0) return res.status(404).json({ error: 'Solicitação não encontrada' });
      res.status(200).json({ message: 'Solicitação atualizada com sucesso' });
    }
  );
});

// Atualizar parcialmente (PATCH)
router.patch('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const allowedFields = ['tutor', 'pet', 'servico_id', 'data_hora', 'status'];
  const validKeys = keys.filter(key => allowedFields.includes(key));
  const validValues = validKeys.map(key => fields[key]);

  if (validKeys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
  }

  const setClause = validKeys.map(key => `${key} = ?`).join(', ');

  db.run(`UPDATE solicitations SET ${setClause} WHERE id = ?`, [...validValues, id], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao atualizar parcialmente' });
    if (this.changes === 0) return res.status(404).json({ error: 'Solicitação não encontrada' });
    res.status(200).json({ message: 'Solicitação atualizada parcialmente com sucesso' });
  });
});

// Deletar
router.delete('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM solicitations WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao deletar a solicitação' });
    if (this.changes === 0) return res.status(404).json({ error: 'Solicitação não encontrada' });
    res.status(200).json({ message: 'Solicitação deletada com sucesso' });
  });
});

module.exports = router;
