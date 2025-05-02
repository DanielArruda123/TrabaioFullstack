var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./database/database.db');

// Criação da tabela produtos
db.run(`CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  descricao TEXT,
  preco REAL,
  estoque INTEGER,
  categoria TEXT
)`, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela produtos:', err);
  } else {
    console.log('Tabela produtos criada com sucesso!');
  }
});

// Criar novo produto
router.post('/produtos', (req, res) => {
  const { nome, descricao, preco, estoque, categoria } = req.body;
  db.run('INSERT INTO produtos (nome, descricao, preco, estoque, categoria) VALUES (?, ?, ?, ?, ?)',
    [nome, descricao, preco, estoque, categoria],
    (err) => {
      if (err) {
        console.error('Erro ao criar o produto:', err);
        return res.status(500).send({ error: 'Erro ao criar o produto' });
      }
      res.status(201).send({ message: 'Produto criado com sucesso' });
    });
});

// Listar todos os produtos
router.get('/produtos', (req, res) => {
  db.all('SELECT * FROM produtos', (err, produtos) => {
    if (err) {
      console.error('Erro ao buscar os produtos:', err);
      return res.status(500).send({ error: 'Erro ao buscar os produtos' });
    }
    res.status(200).send(produtos);
  });
});

// Buscar produto por ID
router.get('/produtos/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM produtos WHERE id = ?', [id], (err, produto) => {
    if (err) {
      console.error('Erro ao buscar o produto:', err);
      return res.status(500).json({ error: 'Erro ao buscar o produto' });
    }
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.status(200).json(produto);
  });
});

// Atualizar completamente um produto
router.put('/produtos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, estoque, categoria } = req.body;

  db.run('UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?, categoria = ? WHERE id = ?',
    [nome, descricao, preco, estoque, categoria, id],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar o produto:', err);
        return res.status(500).json({ error: 'Erro ao atualizar o produto' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      res.status(200).json({ message: 'Produto atualizado com sucesso' });
    });
});

// Atualização parcial de um produto
router.patch('/produtos/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const setClause = keys.map((key) => `${key} = ?`).join(', ');

  db.run(`UPDATE produtos SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
    if (err) {
      console.error('Erro ao atualizar o produto parcialmente:', err);
      return res.status(500).json({ error: 'Erro ao atualizar o produto parcialmente' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.status(200).json({ message: 'Produto atualizado parcialmente com sucesso' });
  });
});

// Deletar um produto
router.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM produtos WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar o produto:', err);
      return res.status(500).json({ error: 'Erro ao deletar o produto' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.status(200).json({ message: 'Produto deletado com sucesso' });
  });
});

module.exports = router;
