var express = require('express');
var router = express.Router();
// var sqlite3 = require('sqlite3'); // Será pego do config centralizado
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

const db = require('../database/config'); // Caminho relativo de 'routes' para 'database/config.js'
const verifyAdmin = require('../auth/verifyAdmin'); // Middleware para verificar se é ADM
const verifyJWT = require('../auth/verify-token'); // Para proteger rotas que podem ser acessadas por usuários logados não-ADM (se houver no futuro)

// Criação da tabela users (sem alterações na estrutura, mas user_id em pets agora referencia esta)
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'user' 
)`, (err) => {
  if (err) {
      console.error('Erro ao criar a tabela users: ', err);
  } else {
      console.log('Tabela users criada com sucesso (com campo role)!');
  }
});

// ROTA DE REGISTRO - PÚBLICA (sem verifyAdmin ou verifyJWT)
router.post('/register', (req,res) =>{
  console.log(req.body)
  const { username, password, email, phone} = req.body;
  const userRole = 'user'; // Novos usuários são 'user' por padrão

  db.get('SELECT * FROM users WHERE username = ?', username, (err,row) =>{
    if(row){
      console.log("Usuário já existe"); // Removido 'err' daqui
      return res.status(400).send({error: 'Nome do usuário já existe'})
    }else{
      bcrypt.hash(password,10,(bcryptErr, hash) => { // Renomeado err para bcryptErr
        if (bcryptErr) {
          console.log("Erro ao criar o hash da senha", bcryptErr)
          return res.status(500).send({error: 'Erro ao criar o hash da senha'}) // Mudado para 500
        }else{
            db.run('INSERT INTO users (username, password, email, phone, role) VALUES(?,?,?,?,?)', 
                   [username, hash, email, phone, userRole], (insertErr)=>{ // Renomeado err para insertErr
              if(insertErr){
                console.log('Erro ao inserir usuário: ', insertErr);
                return res.status(500).send({error: 'Erro ao criar o usuário'})
              }else{
                // Não retorna o usuário completo aqui para não expor o hash da senha, mesmo que seja o de cadastro
                res.status(201).send({message: "Usuário criado com sucesso"})
            }
          })
        }
      })
    }
  })
});

// GET users listing - PROTEGIDO POR verifyAdmin
router.get('/', verifyAdmin, function(req, res, next) {
  // A query já não retorna a senha, o que é bom.
  db.all(`SELECT id, username, email, phone, role FROM users`, (err, users) => {
    if (err) {
      console.log("Usuários não foram encontrados", err);
      return res.status(500).send({ error: "Erro ao buscar usuários" }); // Mensagem genérica
    } else {
      res.status(200).send(users); // A remoção da senha já é feita pela query SELECT
    }
  });
});

// GET single user by ID - PROTEGIDO POR verifyAdmin
router.get('/:id', verifyAdmin, function(req, res, next) {
  const { id } = req.params;
  db.get('SELECT id, username, email, phone, role FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar usuário por ID', err);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(200).json(row);
  });
});


// PUT update a user - PROTEGIDO POR verifyAdmin
router.put('/:id', verifyAdmin, function(req, res, next) {
  const { id } = req.params;
  const { username, password, email, phone, role } = req.body;
  
  let fieldsToUpdate = [];
  let valuesToUpdate = [];

  if (username) {
    fieldsToUpdate.push("username = ?");
    valuesToUpdate.push(username);
  }
  if (email) {
    fieldsToUpdate.push("email = ?");
    valuesToUpdate.push(email);
  }
  if (phone) {
    fieldsToUpdate.push("phone = ?");
    valuesToUpdate.push(phone);
  }
  if (role) { 
    fieldsToUpdate.push("role = ?");
    valuesToUpdate.push(role);
  }

  // Lógica para atualizar a senha (hashear a nova senha)
  if (password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.log("Erro ao criar o hash da nova senha", err);
        return res.status(500).send({ error: 'Erro ao processar nova senha' });
      }
      // Clona para não afetar outras chamadas e adiciona a senha hasheada
      const tempFieldsToUpdateWithPassword = [...fieldsToUpdate, "password = ?"];
      const tempValuesToUpdateWithPassword = [...valuesToUpdate, hash, id];
      
      if (tempFieldsToUpdateWithPassword.length === 1 && tempFieldsToUpdateWithPassword[0] === "password = ?") { 
          // Apenas a senha está sendo atualizada
      } else if (tempFieldsToUpdateWithPassword.length === 0) { // Verificação caso password seja o único campo no if e não haja outros
          return res.status(400).json({ error: 'Nenhum campo válido fornecido para atualização (apenas senha, sem outros campos)' });
      }


      db.run(
        `UPDATE users SET ${tempFieldsToUpdateWithPassword.join(', ')} WHERE id = ?`,
        tempValuesToUpdateWithPassword,
        function(err) {
          if (err) {
            console.error('Erro ao atualizar o usuário com nova senha', err);
            return res.status(500).json({ error: 'Erro ao atualizar o usuário' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado ou dados idênticos' });
          }
          res.status(200).json({ message: 'Usuário atualizado com sucesso' });
        }
      );
    });
  } else { // Sem atualização de senha
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
    }
    valuesToUpdate.push(id); // Adiciona o ID ao final para a cláusula WHERE
    db.run(
      `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      valuesToUpdate,
      function(err) {
        if (err) {
          console.error('Erro ao atualizar o usuário', err);
          return res.status(500).json({ error: 'Erro ao atualizar o usuário' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuário não encontrado ou dados idênticos' });
        }
        res.status(200).json({ message: 'Usuário atualizado com sucesso' });
      }
    );
  }
});


// PATCH partially update a user - PROTEGIDO POR verifyAdmin
router.patch('/:id', verifyAdmin, function(req, res, next) {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  let values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  let setClauseArr = [];
  let finalValues = [];

  const passwordIndex = keys.indexOf('password');
  if (passwordIndex > -1) {
    const plainPassword = values[passwordIndex];
    bcrypt.hash(plainPassword, 10, (err, hash) => {
      if (err) {
        console.error('Erro ao criar hash para PATCH:', err);
        return res.status(500).json({ error: 'Erro ao processar senha para atualização' });
      }
      
      keys.forEach((key, index) => {
        setClauseArr.push(`${key} = ?`);
        finalValues.push(index === passwordIndex ? hash : values[index]);
      });
      finalValues.push(id);

      const setClause = setClauseArr.join(', ');
      db.run(`UPDATE users SET ${setClause} WHERE id = ?`, finalValues, function(err) {
        if (err) {
          console.error('Erro ao atualizar o usuário parcialmente (com senha)', err);
          return res.status(500).json({ error: 'Erro ao atualizar o usuário parcialmente' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuário não encontrado ou dados idênticos' });
        }
        res.status(200).json({ message: 'Usuário atualizado parcialmente com sucesso' });
      });
    });
  } else {
    setClauseArr = keys.map((key) => `${key} = ?`);
    finalValues = [...values, id];
    const setClause = setClauseArr.join(', ');

    db.run(`UPDATE users SET ${setClause} WHERE id = ?`, finalValues, function(err) {
      if (err) {
        console.error('Erro ao atualizar o usuário parcialmente', err);
        return res.status(500).json({ error: 'Erro ao atualizar o usuário parcialmente' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado ou dados idênticos' });
      }
      res.status(200).json({ message: 'Usuário atualizado parcialmente com sucesso' });
    });
  }
});


// DELETE a user - PROTEGIDO POR verifyAdmin
router.delete('/:id', verifyAdmin, function(req, res, next) {
  const { id } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erro ao deletar o usuário', err);
      return res.status(500).json({ error: 'Erro ao deletar o usuário' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(200).json({ message: 'Usuário deletado com sucesso' });
  });
});


module.exports = router;