var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var verifyJWT = require('../auth/verify-token');

const db = new sqlite3.Database('./database/database.db');

// Criar a tabela de solicitações, se não existir
db.run(`CREATE TABLE IF NOT EXISTS solicitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tutor TEXT,
  pet TEXT,
  servico TEXT,
  data_hora TEXT,
  status TEXT
)`, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela solicitations:', err);
  } else {
    console.log('Tabela solicitations criada com sucesso!');
  }
});

// Criar solicitação
router.post('/', verifyJWT, (req, res) => {
  const { tutor, pet, servico, data_hora, status } = req.body;
  db.run(
    'INSERT INTO solicitations (tutor, pet, servico, data_hora, status) VALUES (?, ?, ?, ?, ?)',
    [tutor, pet, servico, data_hora, status],
    (err) => {
      if (err) {
        console.error('Erro ao criar a solicitação:', err);
        return res.status(500).send({ error: 'Erro ao criar a solicitação' });
      }
      res.status(201).send({ message: 'Solicitação criada com sucesso' });
    }
  );
});

// Listar todas as solicitações
router.get('/', verifyJWT, (req, res) => {
  db.all('SELECT * FROM solicitations', (err, solicitations) => {
    if (err) {
      console.error('Erro ao buscar as solicitações:', err);
      return res.status(500).send({ error: 'Erro ao buscar as solicitações' });
    }
    res.status(200).send(solicitations);
  });
});

// Buscar solicitação por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM solicitations WHERE id = ?', [id], (err, solicitation) => {
    if (err) {
      console.error('Erro ao buscar a solicitação:', err);
      return res.status(500).json({ error: 'Erro ao buscar a solicitação' });
    }
    if (!solicitation) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    res.status(200).json(solicitation);
  });
});

// Atualizar completamente uma solicitação
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { tutor, pet, servico, data_hora, status } = req.body;

  db.run(
    'UPDATE solicitations SET tutor = ?, pet = ?, servico = ?, data_hora = ?, status = ? WHERE id = ?',
    [tutor, pet, servico, data_hora, status, id],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar a solicitação:', err);
        return res.status(500).json({ error: 'Erro ao atualizar a solicitação' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada' });
      }
      res.status(200).json({ message: 'Solicitação atualizada com sucesso' });
    }
  );
});

// Atualizar parcialmente uma solicitação
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const setClause = keys.map((key) => `${key} = ?`).join(', ');

  db.run(`UPDATE solicitations SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
    if (err) {
      console.error('Erro ao atualizar a solicitação parcialmente:', err);
      return res.status(500).json({ error: 'Erro ao atualizar a solicitação parcialmente' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    res.status(200).json({ message: 'Solicitação atualizada parcialmente com sucesso' });
  });
});

// Deletar uma solicitação
router.delete('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM solicitations WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar a solicitação:', err);
      return res.status(500).json({ error: 'Erro ao deletar a solicitação' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    res.status(200).json({ message: 'Solicitação deletada com sucesso' });
  });
});

module.exports = router;