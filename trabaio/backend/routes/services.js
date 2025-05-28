var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
const verifyJWT = require('../auth/verify-token'); // Para verificar se está logado
const verifyAdmin = require('../auth/verifyAdmin');   // Para verificar se é ADM

const db = require('../database/config'); // Caminho relativo de 'routes' para 'database/config.js'

// Criação da tabela de serviços (sem alterações)
db.run(`CREATE TABLE IF NOT EXISTS servicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  descricao TEXT,
  preco REAL
)`, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela servicos:', err);
  } else {
    console.log('Tabela servicos criada com sucesso!');
  }
});

// Criar serviço - PROTEGIDO POR verifyAdmin
router.post('/', verifyAdmin, (req, res) => {
  const { nome, descricao, preco } = req.body;
  db.run(
    'INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)',
    [nome, descricao, preco],
    function(err) {
      if (err) {
        console.error('Erro ao criar o serviço:', err);
        return res.status(500).send({ error: 'Erro ao criar o serviço' });
      }
      res.status(201).send({ id: this.lastID, nome, descricao, preco, message: 'Serviço criado com sucesso' });
    }
  );
});

// Listar todos os serviços - AGORA PROTEGIDO POR verifyJWT (qualquer usuário logado pode ver)
router.get('/', verifyJWT, (req, res) => {
  db.all('SELECT * FROM servicos', (err, servicos) => {
    if (err) {
      console.error('Erro ao buscar os serviços:', err);
      return res.status(500).send({ error: 'Erro ao buscar os serviços' });
    }
    res.status(200).send(servicos);
  });
});

// Buscar serviço por ID - AGORA PROTEGIDO POR verifyJWT (qualquer usuário logado pode ver detalhes)
router.get('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM servicos WHERE id = ?', [id], (err, servico) => {
    if (err) {
      console.error('Erro ao buscar o serviço:', err);
      return res.status(500).json({ error: 'Erro ao buscar o serviço' });
    }
    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    res.status(200).json(servico);
  });
});

// Atualizar completamente um serviço - PROTEGIDO POR verifyAdmin
router.put('/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco } = req.body;
  db.run(
    'UPDATE servicos SET nome = ?, descricao = ?, preco = ? WHERE id = ?',
    [nome, descricao, preco, id],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar o serviço:', err);
        return res.status(500).json({ error: 'Erro ao atualizar o serviço' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }
      res.status(200).json({ id: parseInt(id), nome, descricao, preco, message: 'Serviço atualizado com sucesso' });
    }
  );
});

// Atualizar parcialmente um serviço - PROTEGIDO POR verifyAdmin
router.patch('/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }
  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  db.run(`UPDATE servicos SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
    if (err) {
      console.error('Erro ao atualizar o serviço parcialmente:', err);
      return res.status(500).json({ error: 'Erro ao atualizar o serviço parcialmente' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    res.status(200).json({ message: 'Serviço atualizado parcialmente com sucesso' });
  });
});

// Deletar um serviço - PROTEGIDO POR verifyAdmin
router.delete('/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM servicos WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar o serviço:', err);
      return res.status(500).json({ error: 'Erro ao deletar o serviço' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    res.status(200).json({ message: 'Serviço deletado com sucesso' });
  });
});

module.exports = router;