var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var verifyJWT = require('../auth/verify-token')

const db = require('../database/config'); // Caminho relativo de 'routes' para 'database/config.js'

    // Criar a nova tabela
    db.run(`CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      race TEXT,
      colour TEXT,
      gender TEXT
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar a tabela pets:', err);
      } else {
        console.log('Tabela pets criada com sucesso!');
      }
    });

// Criar pet
router.post('/', verifyJWT, (req, res) => {
  const { name, race, colour, gender } = req.body;
  db.run(
    'INSERT INTO pets (name, race, colour, gender) VALUES (?, ?, ?, ?)',
    [name, race, colour, gender],
    (err) => {
      if (err) {
        console.log('Erro ao inserir pet: ', err);
        return res.status(500).send({ error: 'Erro ao cadastrar o pet' });
      } else {
        res.status(201).send({ message: 'Pet cadastrado com sucesso' });
      }
    }
  );
});

// Listar todos os pets
router.get('/', verifyJWT, (req, res) => {
  db.all('SELECT * FROM pets', (err, pets) => {
    if (err) {
      console.log('Erro ao buscar pets: ', err);
      return res.status(500).send({ error: 'Erro ao buscar pets' });
    }
    res.status(200).send(pets);
  });
});

// Buscar pet por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM pets WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar pet: ', err);
      return res.status(500).json({ error: 'Erro ao buscar pet' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Pet não encontrado' });
    }
    res.status(200).json(row);
  });
});

// Atualizar pet por completo
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, race, colour, gender } = req.body;

  db.run(
    'UPDATE pets SET name = ?, race = ?, colour = ?, gender = ? WHERE id = ?',
    [name, race, colour, gender, id],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar o pet: ', err);
        return res.status(500).json({ error: 'Erro ao atualizar o pet' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pet não encontrado' });
      }
      res.status(200).json({ message: 'Pet atualizado com sucesso' });
    }
  );
});

// Atualizar parcialmente um pet
router.patch('/:id', (req, res) => {
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
      console.error('Erro ao atualizar parcialmente o pet: ', err);
      return res.status(500).json({ error: 'Erro ao atualizar o pet' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pet não encontrado' });
    }
    res.status(200).json({ message: 'Pet atualizado parcialmente com sucesso' });
  });
});

// Deletar pet
router.delete('/:id', verifyJWT, function(req, res){
  const { id } = req.params;
  db.run('DELETE FROM pets WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar o pet: ', err);
      return res.status(500).json({ error: 'Erro ao deletar o pet' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pet não encontrado' });
    }
    res.status(200).json({ message: 'Pet deletado com sucesso' });
  });
});

module.exports = router;
