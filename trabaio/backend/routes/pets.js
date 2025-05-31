var express = require('express');
var router = express.Router();
var verifyJWT = require('../auth/verify-token');
const verifyAdmin = require('../auth/verifyAdmin');
const db = require('../database/config');

// Criação da tabela pets (sem alteração)
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

// POST novo pet (sem alteração nesta lógica)
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

/**
 * @swagger
 * /pets:
 * get:
 * summary: Lista os pets. Pode ser filtrado para formulários de tutores.
 * tags: [Pets]
 * security:
 * - bearerAuth: []
 * parameters:
 * - name: editingTutorId
 * in: query
 * description: ID do tutor sendo editado. Retorna pets não associados a OUTROS tutores + pets deste tutor.
 * required: false
 * schema:
 * type: integer
 * - name: forTutorForm
 * in: query
 * description: Se true e editingTutorId não presente, retorna apenas pets não associados a nenhum tutor.
 * required: false
 * schema:
 * type: boolean
 * responses:
 * 200:
 * description: Lista de pets (potencialmente filtrada) retornada com sucesso.
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Pet'
 * 401:
 * description: Não autorizado.
 * 500:
 * description: Erro interno do servidor.
 */
router.get('/', verifyJWT, (req, res) => {
  const editingTutorId = req.query.editingTutorId ? parseInt(req.query.editingTutorId, 10) : null;
  const forTutorForm = req.query.forTutorForm === 'true'; // Verifica se o parâmetro é 'true'

  // Se NENHUM parâmetro de filtro para formulário de tutor for passado, retorna TODOS os pets
  if (!forTutorForm && !editingTutorId) {
    db.all('SELECT * FROM pets ORDER BY name ASC', (err, allPets) => {
      if (err) {
        console.log('Erro ao buscar todos os pets:', err);
        return res.status(500).send({ error: 'Erro ao buscar pets' });
      }
      return res.status(200).send(allPets);
    });
    return; // Finaliza a execução aqui
  }

  // Lógica de filtragem para formulários de tutores (novo ou edição)
  db.all('SELECT id, pets_associados FROM tutores WHERE pets_associados IS NOT NULL AND pets_associados != ""', (err, tutores) => {
    if (err) {
      console.error('Erro ao buscar tutores para verificar pets associados:', err);
      return res.status(500).send({ error: 'Erro ao processar associações de pets' });
    }

    const assignedPetIdsGlobally = new Set(); // Pets associados a QUALQUER tutor
    const petsOfEditingTutorSet = new Set();  // Pets do tutor específico que está sendo editado

    tutores.forEach(tutor => {
      const petIdsForThisTutor = tutor.pets_associados.split(',')
                                   .map(idStr => parseInt(idStr.trim(), 10))
                                   .filter(id => !isNaN(id));
      
      if (editingTutorId && tutor.id === editingTutorId) {
        petIdsForThisTutor.forEach(id => petsOfEditingTutorSet.add(id));
      }
      // Adiciona todos os pets associados (independente de quem seja o tutor)
      // ao `assignedPetIdsGlobally` para a lógica de `forTutorForm` (novo tutor)
      petIdsForThisTutor.forEach(id => assignedPetIdsGlobally.add(id));
    });

    db.all('SELECT * FROM pets ORDER BY name ASC', (err, allPets) => {
      if (err) {
        console.log('Erro ao buscar todos os pets para filtro:', err);
        return res.status(500).send({ error: 'Erro ao buscar lista de pets para filtro' });
      }

      const availablePets = allPets.filter(pet => {
        if (editingTutorId) { // Contexto de EDIÇÃO de um tutor
          // Um pet está disponível se:
          // 1. Pertence ao tutor que está sendo editado (petsOfEditingTutorSet)
          // OU
          // 2. Não está na lista de pets globalmente associados a NINGUÉM (assignedPetIdsGlobally),
          //    o que na verdade significa que ele está disponível para ser associado pela primeira vez.
          //    A lógica correta é: disponível se pertence ao tutor atual OU não está em assignedPetIdsGlobally.
          //    Para evitar que pets de OUTROS tutores apareçam, verificamos se NÃO está em assignedPetIdsGlobally
          //    OU se está no petsOfEditingTutorSet.
          return petsOfEditingTutorSet.has(pet.id) || !assignedPetIdsGlobally.has(pet.id);

        } else if (forTutorForm) { // Contexto de formulário para NOVO tutor
          // Disponível apenas se não estiver no conjunto global de pets já associados
          return !assignedPetIdsGlobally.has(pet.id);
        }
        // Este caso não deveria ser alcançado por causa do `if` no início, mas como fallback:
        return true; 
      });
      
      res.status(200).send(availablePets);
    });
  });
});


// GET /pets/:id (sem alteração nesta lógica)
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

// PUT /pets/:id (sem alteração nesta lógica)
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
        return res.status(404).json({ error: 'Pet não encontrado ou dados idênticos' });
      }
      res.status(200).json({ message: 'Pet atualizado com sucesso' });
    }
  );
});

// PATCH /pets/:id (sem alteração nesta lógica)
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
      return res.status(404).json({ error: 'Pet não encontrado ou dados idênticos' });
    }
    res.status(200).json({ message: 'Pet atualizado parcialmente com sucesso' });
  });
});

// DELETE /pets/:id (sem alteração nesta lógica)
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