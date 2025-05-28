const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const db = require('../database/config'); // Caminho relativo de 'routes' para 'database/config.js'

// Criação da tabela de tutores
db.run(`
  CREATE TABLE IF NOT EXISTS tutores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    contato TEXT NOT NULL,
    endereco TEXT NOT NULL,
    pets_associados TEXT
  )
`);

// Listar todos os tutores
router.get('/', (req, res) => {
  db.all('SELECT * FROM tutores', (err, tutores) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar tutores' });
    res.status(200).json(tutores);
  });
});

// Criar tutor
router.post('/', (req, res) => {
  const { nome, contato, endereco, pets_associados } = req.body;
  db.run(
    'INSERT INTO tutores (nome, contato, endereco, pets_associados) VALUES (?, ?, ?, ?)',
    [nome, contato, endereco, pets_associados || ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao criar tutor' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Buscar tutor por ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM tutores WHERE id = ?', [req.params.id], (err, tutor) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar tutor' });
    if (!tutor) return res.status(404).json({ error: 'Tutor não encontrado' });
    res.status(200).json(tutor);
  });
});

// Atualizar tutor
router.put('/:id', (req, res) => {
  const { nome, contato, endereco, pets_associados } = req.body;
  db.run(
    'UPDATE tutores SET nome = ?, contato = ?, endereco = ?, pets_associados = ? WHERE id = ?',
    [nome, contato, endereco, pets_associados, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao atualizar tutor' });
      if (this.changes === 0) return res.status(404).json({ error: 'Tutor não encontrado' });
      res.status(200).json({ message: 'Tutor atualizado' });
    }
  );
});

// Deletar tutor
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM tutores WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao deletar tutor' });
    if (this.changes === 0) return res.status(404).json({ error: 'Tutor não encontrado' });
    res.status(200).json({ message: 'Tutor deletado' });
  });
});

module.exports = router;