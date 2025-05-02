var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./database/database.db');

// Criação da tabela pets

db.run(`CREATE TABLE IF NOT EXISTS pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  especie TEXT,
  raca TEXT,
  idade INTEGER,
  tutor_info TEXT
)`, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela pets:', err);
  } else {
    console.log('Tabela pets criada com sucesso!');
  }
});

// Criar novo pet
router.post('/pets', (req, res) => {
  const { nome, especie, raca, idade, tutor_info } = req.body;
  db.run('INSERT INTO pets (nome, especie, raca, idade, tutor_info) VALUES (?, ?, ?, ?, ?)',
    [nome, especie, raca, idade, tutor_info],
    (err) => {
      if (err) {
        console.error('Erro ao criar o pet:', err);
        return res.status(500).send({ error: 'Erro ao criar o pet' });
      }
      res.status(201).send({ messidade: 'Pet criado com sucesso' });
    });
});

// Listar todos os pets
router.get('/pets', (req, res) => {
  db.all('SELECT * FROM pets', (err, pets) => {
    if (err) {
      console.error('Erro ao buscar os pets:', err);
      return res.status(500).send({ error: 'Erro ao buscar os pets' });
    }
    res.status(200).send(pets);
  });
});

// Buscar pet por ID
router.get('/pets/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM pets WHERE id = ?', [id], (err, pet) => {
    if (err) {
      console.error('Erro ao buscar o pet:', err);
      return res.status(500).json({ error: 'Erro ao buscar o pet' });
    }
    if (!pet) {
      return res.status(404).json({ error: 'Pet não encontrado' });
    }
    res.status(200).json(pet);
  });
});

// Atualizar completamente um pet
router.put('/pets/:id', (req, res) => {
  const { id } = req.params;
  const { nome, especie, raca, idade, tutor_info } = req.body;

  db.run('UPDATE pets SET nome = ?, especie = ?, raca = ?, idade = ?, tutor_info = ? WHERE id = ?',
    [nome, especie, raca, idade, tutor_info, id],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar o pet:', err);
        return res.status(500).json({ error: 'Erro ao atualizar o pet' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pet não encontrado' });
      }
      res.status(200).json({ messidade: 'Pet atualizado com sucesso' });
    });
});

// Atualização parcial de um pet
router.patch('/pets/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const setClause = keys.map((key) => `${key} = ?`).join(', ');

  db.run(`UPDATE pets SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
    if (err) {
      console.error('Erro ao atualizar o pet parcialmente:', err);
      return res.status(500).json({ error: 'Erro ao atualizar o pet parcialmente' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pet não encontrado' });
    }
    res.status(200).json({ messidade: 'Pet atualizado parcialmente com sucesso' });
  });
});

// Deletar um pet
router.delete('/pets/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM pets WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar o pet:', err);
      return res.status(500).json({ error: 'Erro ao deletar o pet' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pet não encontrado' });
    }
    res.status(200).json({ messidade: 'Pet deletado com sucesso' });
  });
});

module.exports = router;