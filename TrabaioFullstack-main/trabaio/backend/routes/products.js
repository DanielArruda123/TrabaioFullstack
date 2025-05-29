var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var verifyJWT = require('../auth/verify-token');

const db = require('../database/config'); // Caminho relativo de 'routes' para 'database/config.js'

// Ajuste da tabela de produtos para novos campos
db.run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  descricao TEXT,
  preco REAL,
  estoque INTEGER,
  categoria TEXT,
  animal TEXT,
  images TEXT
)`, (err) => {
  if (err) {
    console.error('Erro ao criar/ajustar a tabela products:', err);
  } else {
    console.log('Tabela products criada/ajustada com sucesso!');
  }
});

// Criar produto
router.post('/', verifyJWT, (req, res) => {
  const { nome, descricao, preco, estoque, categoria, animal, images } = req.body;
  db.run(
    'INSERT INTO products (nome, descricao, preco, estoque, categoria, animal, images) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      nome,
      descricao,
      preco,
      estoque,
      categoria,
      animal || null,
      images ? JSON.stringify(images) : null
    ],
    (err) => {
      if (err) {
        console.error('Erro ao inserir produto: ', err);
        return res.status(500).send({ error: 'Erro ao cadastrar o produto' });
      }
      res.status(201).send({ message: 'Produto cadastrado com sucesso' });
    }
  );
});

// Listar todos os produtos
router.get('/', verifyJWT, (req, res) => {
  db.all('SELECT * FROM products', (err, products) => {
    if (err) {
      console.error('Erro ao buscar produtos: ', err);
      return res.status(500).send({ error: 'Erro ao buscar produtos' });
    }
    // Parse images para array, se existir
    products = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : []
    }));
    res.status(200).send(products);
  });
});

// Buscar produto por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar produto: ', err);
      return res.status(500).json({ error: 'Erro ao buscar produto' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    row.images = row.images ? JSON.parse(row.images) : [];
    res.status(200).json(row);
  });
});

// Atualizar produto por completo
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, estoque, categoria, animal, images } = req.body;

  db.run(
    'UPDATE products SET nome = ?, descricao = ?, preco = ?, estoque = ?, categoria = ?, animal = ?, images = ? WHERE id = ?',
    [
      nome,
      descricao,
      preco,
      estoque,
      categoria,
      animal || null,
      images ? JSON.stringify(images) : null,
      id
    ],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar o produto: ', err);
        return res.status(500).json({ error: 'Erro ao atualizar o produto' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      res.status(200).json({ message: 'Produto atualizado com sucesso' });
    }
  );
});

// Atualizar parcialmente produto
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const setClause = keys.map((key) => `${key} = ?`).join(', ');

  const finalValues = keys.map((key, idx) =>
    key === 'images' ? JSON.stringify(values[idx]) : values[idx]
  );

  db.run(`UPDATE products SET ${setClause} WHERE id = ?`, [...finalValues, id], function (err) {
    if (err) {
      console.error('Erro ao atualizar parcialmente o produto: ', err);
      return res.status(500).json({ error: 'Erro ao atualizar o produto' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.status(200).json({ message: 'Produto atualizado parcialmente com sucesso' });
  });
});

// Deletar produto
router.delete('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar o produto: ', err);
      return res.status(500).json({ error: 'Erro ao deletar o produto' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.status(200).json({ message: 'Produto deletado com sucesso' });
  });
});

module.exports = router;
