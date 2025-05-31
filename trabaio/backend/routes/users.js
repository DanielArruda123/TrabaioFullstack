var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

const db = require('../database/config');
const verifyAdmin = require('../auth/verifyAdmin');
const verifyJWT = require('../auth/verify-token');

// A definição de 'tags' e 'components: schemas: User, UserResponse, NewUser'
// foi movida para app.js

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

/**
 * @swagger
 * /users/register:
 * post:
 * summary: Registra um novo usuário.
 * tags: [Users]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/NewUser'
 * responses:
 * 201:
 * description: Usuário criado com sucesso.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: Usuário criado com sucesso
 * 400:
 * description: Nome de usuário já existe.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * 500:
 * description: Erro interno do servidor.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * security: [] # Rota pública
 */
router.post('/register', (req,res) =>{
  console.log(req.body)
  const { username, password, email, phone} = req.body;
  const userRole = 'ADM';

  db.get('SELECT * FROM users WHERE username = ?', username, (err,row) =>{
    if(row){
      console.log("Usuário já existe");
      return res.status(400).send({error: 'Nome do usuário já existe'})
    }else{
      bcrypt.hash(password,10,(bcryptErr, hash) => { 
        if (bcryptErr) {
          console.log("Erro ao criar o hash da senha", bcryptErr)
          return res.status(500).send({error: 'Erro ao criar o hash da senha'}) 
        }else{
            db.run('INSERT INTO users (username, password, email, phone, role) VALUES(?,?,?,?,?)', 
                   [username, hash, email, phone, userRole], (insertErr)=>{
              if(insertErr){
                console.log('Erro ao inserir usuário: ', insertErr);
                return res.status(500).send({error: 'Erro ao criar o usuário'})
              }else{
                res.status(201).send({message: "Usuário criado com sucesso"})
            }
          })
        }
      })
    }
  })
});

// /**
//  * @swagger
//  * /users:
//  * get:
//  * summary: Retorna a lista de todos os usuários.
//  * tags: [Users]
//  * security:
//  * - bearerAuth: []
//  * responses:
//  * 200:
//  * description: Lista de usuários retornada com sucesso.
//  * content:
//  * application/json:
//  * schema:
//  * type: array
//  * items:
//  * $ref: '#/components/schemas/UserResponse'
//  * 401:
//  * description: Não autorizado.
//  * 403:
//  * description: Acesso negado.
//  * 500:
//  * description: Erro interno do servidor.
//  */
router.get('/', verifyAdmin, function(req, res, next) {
  db.all(`SELECT id, username, email, phone, role FROM users`, (err, users) => {
    if (err) {
      console.log("Usuários não foram encontrados", err);
      return res.status(500).send({ error: "Erro ao buscar usuários" });
    } else {
      res.status(200).send(users);
    }
  });
});

// /**
//  * @swagger
//  * /users/{id}:
//  * get:
//  * summary: Retorna um usuário específico pelo ID.
//  * tags: [Users]
//  * security:
//  * - bearerAuth: []
//  * parameters:
//  * - in: path
//  * name: id
//  * schema:
//  * type: integer
//  * required: true
//  * description: ID do usuário.
//  * responses:
//  * 200:
//  * description: Usuário retornado com sucesso.
//  * content:
//  * application/json:
//  * schema:
//  * $ref: '#/components/schemas/UserResponse'
//  * 401:
//  * description: Não autorizado.
//  * 403:
//  * description: Acesso negado.
//  * 404:
//  * description: Usuário não encontrado.
//  * 500:
//  * description: Erro interno do servidor.
//  */
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

// /**
//  * @swagger
//  * /users/{id}:
//  * put:
//  * summary: Atualiza um usuário existente.
//  * tags: [Users]
//  * security:
//  * - bearerAuth: []
//  * parameters:
//  * - in: path
//  * name: id
//  * schema:
//  * type: integer
//  * required: true
//  * description: ID do usuário a ser atualizado.
//  * requestBody:
//  * required: true
//  * content:
//  * application/json:
//  * schema:
//  * type: object
//  * properties:
//  * username:
//  * type: string
//  * password:
//  * type: string
//  * format: password
//  * description: Nova senha (opcional).
//  * email:
//  * type: string
//  * format: email
//  * phone:
//  * type: string
//  * role:
//  * type: string
//  * enum: [user, ADM]
//  * responses:
//  * 200:
//  * description: Usuário atualizado com sucesso.
//  * 400:
//  * description: Nenhum campo fornecido para atualização.
//  * 401:
//  * description: Não autorizado.
//  * 403:
//  * description: Acesso negado.
//  * 404:
//  * description: Usuário não encontrado ou dados idênticos.
//  * 500:
//  * description: Erro interno do servidor.
//  */
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

  if (password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.log("Erro ao criar o hash da nova senha", err);
        return res.status(500).send({ error: 'Erro ao processar nova senha' });
      }
      const tempFieldsToUpdateWithPassword = [...fieldsToUpdate, "password = ?"];
      const tempValuesToUpdateWithPassword = [...valuesToUpdate, hash, id];
      
      if (tempFieldsToUpdateWithPassword.length === 1 && tempFieldsToUpdateWithPassword[0] === "password = ?") { 
      } else if (tempFieldsToUpdateWithPassword.length === 0 && !fieldsToUpdate.includes("password = ?")) { 
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
  } else { 
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
    }
    valuesToUpdate.push(id); 
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

// /**
//  * @swagger
//  * /users/{id}:
//  * patch:
//  * summary: Atualiza parcialmente um usuário existente.
//  * tags: [Users]
//  * security:
//  * - bearerAuth: []
//  * parameters:
//  * - in: path
//  * name: id
//  * schema:
//  * type: integer
//  * required: true
//  * description: ID do usuário a ser atualizado.
//  * requestBody:
//  * required: true
//  * content:
//  * application/json:
//  * schema:
//  * type: object
//  * properties:
//  * username:
//  * type: string
//  * password:
//  * type: string
//  * format: password
//  * email:
//  * type: string
//  * format: email
//  * phone:
//  * type: string
//  * role:
//  * type: string
//  * enum: [user, ADM]
//  * responses:
//  * 200:
//  * description: Usuário atualizado parcialmente com sucesso.
//  * 400:
//  * description: Nenhum campo fornecido para atualização.
//  * 401:
//  * description: Não autorizado.
//  * 403:
//  * description: Acesso negado.
//  * 404:
//  * description: Usuário não encontrado ou dados idênticos.
//  * 500:
//  * description: Erro interno do servidor.
//  */
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

// /**
//  * @swagger
//  * /users/{id}:
//  * delete:
//  * summary: Deleta um usuário pelo ID.
//  * tags: [Users]
//  * security:
//  * - bearerAuth: []
//  * parameters:
//  * - in: path
//  * name: id
//  * schema:
//  * type: integer
//  * required: true
//  * description: ID do usuário a ser deletado.
//  * responses:
//  * 200:
//  * description: Usuário deletado com sucesso.
//  * 401:
//  * description: Não autorizado.
//  * 403:
//  * description: Acesso negado.
//  * 404:
//  * description: Usuário não encontrado.
//  * 500:
//  * description: Erro interno do servidor.
//  */
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