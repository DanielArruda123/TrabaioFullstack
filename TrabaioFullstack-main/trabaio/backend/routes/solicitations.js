var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var verifyJWT = require('../auth/verify-token'); // verifyJWT é usado aqui

const db = require('../database/config'); // Caminho relativo de 'routes' para 'database/config.js'

// Criar a tabela de solicitações, se não existir (sem alterações)
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

// Criar solicitação - MODIFICADO para usar req.user
router.post('/', verifyJWT, (req, res) => {
  // Os dados do usuário (tutor) virão do token decodificado (req.user)
  const userMakingRequest = req.user; 

  // Os outros campos vêm do corpo da requisição enviada pelo frontend (cart.ejs)
  const { pet, servico, data_hora, status } = req.body;

  let tutorInfoForDB;
  if (userMakingRequest && userMakingRequest.username) {
    tutorInfoForDB = userMakingRequest.username; // Usando o username do token
  } else if (userMakingRequest && userMakingRequest.id) {
    // Fallback se username não estiver no token, mas ID estiver (embora tenhamos adicionado username)
    tutorInfoForDB = `Usuário ID: ${userMakingRequest.id}`; 
  } else {
    // Isso não deveria acontecer se verifyJWT funcionou corretamente
    console.error("Erro: req.user não está definido ou não contém username/id após verifyJWT.");
    return res.status(401).send({ error: 'Informação do usuário não encontrada no token.' });
  }

  db.run(
    'INSERT INTO solicitations (tutor, pet, servico, data_hora, status) VALUES (?, ?, ?, ?, ?)',
    [tutorInfoForDB, pet, servico, data_hora, status], // Usando tutorInfoForDB
    function(err) { // Usar function para ter acesso a this.lastID
      if (err) {
        console.error('Erro ao criar a solicitação:', err);
        return res.status(500).send({ error: 'Erro ao criar a solicitação no banco de dados.' });
      }
      res.status(201).send({ 
        id: this.lastID, 
        tutor: tutorInfoForDB, // Retornando a informação do tutor usada
        pet, 
        servico, 
        data_hora, 
        status, 
        message: 'Solicitação criada com sucesso' 
      });
    }
  );
});

// Listar todas as solicitações (mantido como estava, protegido por verifyJWT)
router.get('/', verifyJWT, (req, res) => {
  db.all('SELECT * FROM solicitations', (err, solicitations) => {
    if (err) {
      console.error('Erro ao buscar as solicitações:', err);
      return res.status(500).send({ error: 'Erro ao buscar as solicitações' });
    }
    res.status(200).send(solicitations);
  });
});

// Buscar solicitação por ID (mantido como estava, sem verifyJWT - considerar adicionar se necessário)
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

// Atualizar completamente uma solicitação (mantido como estava, sem verifyJWT - considerar adicionar)
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

// Atualizar parcialmente uma solicitação (mantido como estava, sem verifyJWT - considerar adicionar)
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

// Deletar uma solicitação (mantido como estava, protegido por verifyJWT)
router.delete('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM solicitations WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar a solicitação:', err);
      return res.status(500).json({ error: 'Erro ao deletar o serviço' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    res.status(200).json({ message: 'Solicitação deletada com sucesso' });
  });
});

module.exports = router;