var express = require('express');
var router = express.Router();
var verifyJWT = require('../auth/verify-token');
const verifyAdmin = require('../auth/verifyAdmin'); // Corrigido

const db = require('../database/config');

// As definições de 'tags' e 'components: schemas: Pet, NewPet'
// foram movidas para app.js

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

/**
 * @swagger
 * /pets:
 * post:
 * summary: Cria um novo pet.
 * tags: [Pets]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/NewPet'
 * responses:
 * 201:
 * description: Pet cadastrado com sucesso.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * id:
 * type: integer
 * message:
 * type: string
 * 401:
 * description: Não autorizado.
 * 500:
 * description: Erro ao cadastrar o pet.
 */
router.post('/', verifyJWT, (req, res) => {
  const { name, race, colour, gender } = req.body;
  db.run(
    'INSERT INTO pets (name, race, colour, gender) VALUES (?, ?, ?, ?)',
    [name, race, colour, gender],
    function (err) {
      if (err) {
        console.log('Erro ao inserir pet: ', err);
        return res.status(500).send({ error: 'Erro ao cadastrar o pet' });
      } else {
        res.status(201).send({ id: this.lastID, message: 'Pet cadastrado com sucesso' });
      }
    }
  );
});

// /**
//  * @swagger
//  * /pets:
//  * get:
//  * summary: Lista todos os pets.
//  * tags: [Pets]
//  * security:
//  * - bearerAuth: []
//  * responses:
//  * 200:
//  * description: Lista de pets retornada com sucesso.
//  * content:
//  * application/json:
//  * schema:
//  * type: array
//  * items:
//  * $ref: '#/components/schemas/Pet'
//  * 401:
//  * description: Não autorizado.
//  * 500:
//  * description: Erro ao buscar pets.
//  */
router.get('/', verifyJWT, (req, res) => {
  db.all('SELECT * FROM pets', (err, pets) => {
    if (err) {
      console.log('Erro ao buscar pets: ', err);
      return res.status(500).send({ error: 'Erro ao buscar pets' });
    }
    res.status(200).send(pets);
  });
});

// /**
//  * @swagger
//  * /pets/{id}:
//  * get:
//  * summary: Busca um pet pelo ID.
//  * tags: [Pets]
//  * security:
//  * - bearerAuth: []
//  * parameters:
//  * - in: path
//  * name: id
//  * schema:
//  * type: integer
//  * required: true
//  * description: ID do pet.
//  * responses:
//  * 200:
//  * description: Pet retornado com sucesso.
//  * content:
//  * application/json:
//  * schema:
//  * $ref: '#/components/schemas/Pet'
//  * 401:
//  * description: Não autorizado.
//  * 404:
//  * description: Pet não encontrado.
//  * 500:
//  * description: Erro ao buscar pet.
//  */
router.get('/:id', verifyJWT, (req, res) => { 
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

// /**
//  * @swagger
//  * /pets/{id}:
//  * put:
//  * summary: Atualiza um pet existente. Requer privilégios de ADM.
//  * tags: [Pets]
//  * security:
//  * - bearerAuth: []
//  * parameters:
//  * - in: path
//  * name: id
//  * schema:
//  * type: integer
//  * required: true
//  * description: ID do pet a ser atualizado.
//  * requestBody:
//  * required: true
//  * content:
//  * application/json:
//  * schema:
//  * $ref: '#/components/schemas/NewPet'
//  * responses:
//  * 200:
//  * description: Pet atualizado com sucesso.
//  * 401:
//  * description: Não autorizado.
//  * 403:
//  * description: Acesso negado.
//  * 404:
//  * description: Pet não encontrado.
//  * 500:
//  * description: Erro ao atualizar o pet.
//  */
router.put('/:id', verifyAdmin, (req, res) => {
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

// /**
//  * @swagger
//  * /pets/{id}:
//  * patch:
//  * summary: Atualiza parcialmente um pet existente. Requer privilégios de ADM.
//  * tags: [Pets]
//  * security:
//  * - bearerAuth: []
//  * parameters:
//  * - in: path
//  * name: id
//  * schema:
//  * type: integer
//  * required: true
//  * description: ID do pet a ser atualizado.
//  * requestBody:
//  * required: true
//  * content:
//  * application/json:
//  * schema:
//  * type: object
//  * properties:
//  * name:
//  * type: string
//  * race:
//  * type: string
//  * colour:
//  * type: string
//  * gender:
//  * type: string
//  * responses:
//  * 200:
//  * description: Pet atualizado parcialmente com sucesso.
//  * 400:
//  * description: Nenhum campo fornecido para atualização.
//  * 401:
//  * description: Não autorizado.
//  * 403:
//  * description: Acesso negado.
//  * 404:
//  * description: Pet não encontrado.
//  * 500:
//  * description: Erro ao atualizar o pet.
//  */
router.patch('/:id', verifyAdmin, (req, res) => {
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

// /**
//  * @swagger
//  * /pets/{id}:
//  * delete:
//  * summary: Deleta um pet pelo ID. Requer privilégios de ADM.
//  * tags: [Pets]
//  * security:
//  * - bearerAuth: []
//  * parameters:
//  * - in: path
//  * name: id
//  * schema:
//  * type: integer
//  * required: true
//  * description: ID do pet a ser deletado.
//  * responses:
//  * 200:
//  * description: Pet deletado com sucesso.
//  * 401:
//  * description: Não autorizado.
//  * 403:
//  * description: Acesso negado.
//  * 404:
//  * description: Pet não encontrado.
//  * 500:
//  * description: Erro ao deletar o pet.
//  */
router.delete('/:id', verifyAdmin, function(req, res){ 
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