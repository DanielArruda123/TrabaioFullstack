const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const verifyJWT = require('../auth/verify-token');

const db = new sqlite3.Database('./database/database.db');

// Criação da tabela de tutores (se não existir)
db.run(`
  CREATE TABLE IF NOT EXISTS tutores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    contato TEXT NOT NULL,
    endereco TEXT NOT NULL,
    pets_associados TEXT
  )
`, (err) => {
  if (err) {
    console.error('Erro ao criar/verificar tabela tutores:', err);
  } else {
    console.log('Tabela tutores criada/verificada com sucesso!');
  }
});

// Rota: Criar um tutor
router.post('/', verifyJWT, (req, res) => {
  const { nome, contato, endereco, pets_associados } = req.body;

  if (!nome || !contato || !endereco) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, contato e endereço' });
  }

  db.run(
    'INSERT INTO tutores (nome, contato, endereco, pets_associados) VALUES (?, ?, ?, ?)',
    [nome, contato, endereco, pets_associados || ''],
    function (err) {
      if (err) {
        console.error('Erro ao criar o tutor:', err);
        return res.status(500).json({ error: 'Erro ao criar o tutor' });
      }
      res.status(201).json({ message: 'Tutor criado com sucesso', id: this.lastID });
    }
  );
});

// Rota: Listar todos os tutores
router.get('/', verifyJWT, (req, res) => {
  db.all('SELECT * FROM tutores', (err, tutores) => {
    if (err) {
      console.error('Erro ao buscar os tutores:', err);
      return res.status(500).json({ error: 'Erro ao buscar os tutores' });
    }
    res.status(200).json(tutores);
  });
});

// Rota: Buscar tutor por ID
router.get('/:id', verifyJWT, (req, res) => {
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

// Rota: Atualizar completamente um tutor
router.put('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  const { nome, contato, endereco, pets_associados } = req.body;

  if (!nome || !contato || !endereco || pets_associados === undefined) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios para atualização completa' });
  }

  db.run(
    'UPDATE tutores SET nome = ?, contato = ?, endereco = ?, pets_associados = ? WHERE id = ?',
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
    }
  );
});

// Rota: Atualização parcial de um tutor
router.patch('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const allowedFields = ['nome', 'contato', 'endereco', 'pets_associados'];
  const validKeys = keys.filter(key => allowedFields.includes(key));

  if (validKeys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
  }

  const setClause = validKeys.map(key => `${key} = ?`).join(', ');
  const values = validKeys.map(key => fields[key]);

  db.run(`UPDATE tutores SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
    if (err) {
      console.error('Erro ao atualizar parcialmente o tutor:', err);
      return res.status(500).json({ error: 'Erro ao atualizar parcialmente o tutor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tutor não encontrado' });
    }
    res.status(200).json({ message: 'Tutor atualizado parcialmente com sucesso' });
  });
});

// Rota: Deletar tutor
router.delete('/:id', verifyJWT, (req, res) => {
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

