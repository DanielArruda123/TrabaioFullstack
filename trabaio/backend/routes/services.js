var express = require('express');
var router = express.Router();
// var sqlite3 = require('sqlite3'); // Não é necessário se 'db' já está configurado e importado abaixo
const verifyJWT = require('../auth/verify-token'); // Para verificar se está logado
const verifyAdmin = require('../auth/verifyAdmin');   // Para verificar se é ADM
const db = require('../database/config'); // Caminho para sua configuração de banco de dados

// Criação da tabela de serviços
db.run(`CREATE TABLE IF NOT EXISTS servicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  descricao TEXT,
  preco REAL 
)`, (err) => { // A coluna preco é REAL, o que é correto para números decimais
  if (err) {
    console.error('Erro ao criar a tabela servicos:', err);
  } else {
    console.log('Tabela servicos criada com sucesso!');
  }
});

// Criar serviço - PROTEGIDO POR verifyAdmin
router.post('/', verifyAdmin, (req, res) => {
  const { nome, descricao } = req.body;
  let precoInput = req.body.preco; // Pega o preço do corpo da requisição
  let precoParaSalvar;

  // Validação e conversão do preço
  if (precoInput === null || typeof precoInput === 'undefined' || String(precoInput).trim() === '') {
    precoParaSalvar = null; // Armazena NULL se o preço for vazio, nulo ou indefinido
  } else {
    // Tenta converter para número. Substitui vírgula por ponto se vier no formato brasileiro.
    precoParaSalvar = parseFloat(String(precoInput).replace(',', '.'));
    if (isNaN(precoParaSalvar)) {
      // Se não for um número válido após a conversão, retorna erro
      return res.status(400).send({ error: 'Formato de preço inválido. Use um número (ex: 50.99).' });
    }
  }

  db.run(
    'INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)',
    [nome, descricao, precoParaSalvar], // Salva o preço tratado (número ou NULL)
    function(err) { // Usar 'function' para ter acesso a 'this.lastID'
      if (err) {
        console.error('Erro ao criar o serviço:', err);
        return res.status(500).send({ error: 'Erro ao criar o serviço no banco de dados.' });
      }
      // Retorna o serviço criado, incluindo o preço como foi salvo
      res.status(201).send({ 
        id: this.lastID, 
        nome, 
        descricao, 
        preco: precoParaSalvar, 
        message: 'Serviço criado com sucesso' 
      });
    }
  );
});

// Listar todos os serviços - PROTEGIDO POR verifyJWT
router.get('/', verifyJWT, (req, res) => {
  // Seleciona campos explicitamente e ordena por nome para consistência
  db.all('SELECT id, nome, descricao, preco FROM servicos ORDER BY nome ASC', [], (err, servicos) => {
    if (err) {
      console.error('Erro ao buscar os serviços:', err);
      return res.status(500).send({ error: 'Erro ao buscar os serviços' });
    }
    // O campo 'preco' virá como número ou null, conforme armazenado no banco
    res.status(200).send(servicos);
  });
});

// Buscar serviço por ID - PROTEGIDO POR verifyJWT
router.get('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  // Seleciona campos explicitamente
  db.get('SELECT id, nome, descricao, preco FROM servicos WHERE id = ?', [id], (err, servico) => {
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
  const { nome, descricao } = req.body;
  let precoInput = req.body.preco;
  let precoParaSalvar;

  // Validação e conversão do preço (similar ao POST)
  if (precoInput === null || typeof precoInput === 'undefined' || String(precoInput).trim() === '') {
    precoParaSalvar = null;
  } else {
    precoParaSalvar = parseFloat(String(precoInput).replace(',', '.'));
    if (isNaN(precoParaSalvar)) {
      return res.status(400).json({ error: 'Formato de preço inválido. Use um número (ex: 50.99).' });
    }
  }

  db.run(
    'UPDATE servicos SET nome = ?, descricao = ?, preco = ? WHERE id = ?',
    [nome, descricao, precoParaSalvar, id],
    function (err) { // Usar 'function' para ter acesso a 'this.changes'
      if (err) {
        console.error('Erro ao atualizar o serviço:', err);
        return res.status(500).json({ error: 'Erro ao atualizar o serviço' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Serviço não encontrado ou nenhum dado alterado' });
      }
      // Retorna o serviço atualizado
      res.status(200).json({ 
        id: parseInt(id), 
        nome, 
        descricao, 
        preco: precoParaSalvar, 
        message: 'Serviço atualizado com sucesso' 
      });
    }
  );
});

// Atualizar parcialmente um serviço - PROTEGIDO POR verifyAdmin
router.patch('/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  
  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const setParts = [];
  const valuesToUpdate = [];

  for (const key of keys) {
    if (['nome', 'descricao'].includes(key)) {
      setParts.push(`${key} = ?`);
      valuesToUpdate.push(fields[key]);
    } else if (key === 'preco') {
      let precoInput = fields[key];
      let precoParaSalvar;
      if (precoInput === null || typeof precoInput === 'undefined' || String(precoInput).trim() === '') {
        precoParaSalvar = null;
      } else {
        precoParaSalvar = parseFloat(String(precoInput).replace(',', '.'));
        if (isNaN(precoParaSalvar)) {
          return res.status(400).json({ error: `Formato de preço inválido para o campo '${key}'. Use um número (ex: 50.99).` });
        }
      }
      setParts.push(`${key} = ?`);
      valuesToUpdate.push(precoParaSalvar);
    }
    // Ignora outros campos não permitidos para PATCH para evitar erros
  }

  if (setParts.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido fornecido para atualização ou preço inválido.' });
  }

  const setClause = setParts.join(', ');
  valuesToUpdate.push(id); // Adiciona o ID por último para a cláusula WHERE

  db.run(`UPDATE servicos SET ${setClause} WHERE id = ?`, valuesToUpdate, function (err) {
    if (err) {
      console.error('Erro ao atualizar o serviço parcialmente:', err);
      return res.status(500).json({ error: 'Erro ao atualizar o serviço parcialmente' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado ou nenhum dado alterado' });
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