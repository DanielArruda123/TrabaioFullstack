var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./database/database.db');

// Criação da tabela tutores

db.run(`CREATE TABLE IF NOT EXISTS tutores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  contato TEXT,
  endereco TEXT,
  pets_associados TEXT
)`, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela tutores:', err);
  } else {
    console.log('Tabela tutores criada com sucesso!');
  }
});

// Criar novo tutor
router.post('/tutores', (req, res) => {
  const { nome, contato, endereco, pets_associados } = req.body;
  db.run('INSERT INTO tutores (nome, contato, endereco, pets_associados) VALUES (?, ?, ?, ?)',
    [nome, contato, endereco, pets_associados],
    (err) => {
      if (err) {
        console.error('Erro ao criar o tutor:', err);
        return res.status(500).send({ error: 'Erro ao criar o tutor' });
      }
      res.status(201).send({ message: 'Tutor criado com sucesso' });
    });
});

// Listar todos os tutores
router.get('/tutores', (req, res) => {
  db.all('SELECT * FROM tutores', (err, tutores) => {
    if (err) {
      console.error('Erro ao buscar os tutores:', err);
      return res.status(500).send({ error: 'Erro ao buscar os tutores' });
    }
    res.status(200).send(tutores);
  });
});

// Buscar tutor por ID
router.get('/tutores/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM tutores WHERE id = ?', [id], (err, tutor) => {
    if (err) {
      console.error('Erro ao buscar o tutor:', err);
      return res.status(500).json({ error: 'Erro ao buscar o tutor' });
    }
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor não encontrado' });
    }
    res.status(200).json(tutor);
  });
});

// Atualizar completamente um tutor
router.put('/tutores/:id', (req, res) => {
  const { id } = req.params;
  const { nome, contato, endereco, pets_associados } = req.body;

  db.run('UPDATE tutores SET nome = ?, contato = ?, endereco = ?, pets_associados = ? WHERE id = ?',
    [nome, contato, endereco, pets_associados, id],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar o tutor:', err);
        return res.status(500).json({ error: 'Erro ao atualizar o tutor' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tutor não encontrado' });
      }
      res.status(200).json({ message: 'Tutor atualizado com sucesso' });
    });
});

// Atualização parcial de um tutor
router.patch('/tutores/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const setClause = keys.map((key) => `${key} = ?`).join(', ');

  db.run(`UPDATE tutores SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
    if (err) {
      console.error('Erro ao atualizar o tutor parcialmente:', err);
      return res.status(500).json({ error: 'Erro ao atualizar o tutor parcialmente' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tutor não encontrado' });
    }
    res.status(200).json({ message: 'Tutor atualizado parcialmente com sucesso' });
  });
});

// Deletar um tutor
router.delete('/tutores/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tutores WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar o tutor:', err);
      return res.status(500).json({ error: 'Erro ao deletar o tutor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tutor não encontrado' });
    }
    res.status(200).json({ message: 'Tutor deletado com sucesso' });
  });
});

module.exports = router;
