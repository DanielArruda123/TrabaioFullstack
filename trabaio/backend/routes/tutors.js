const express = require('express');
const router = express.Router();
// const sqlite3 = require('sqlite3'); // Não é necessário se 'db' já está configurado
const db = require('../database/config'); // Caminho relativo de 'routes' para 'database/config.js'
const verifyJWT = require('../auth/verify-token'); // Importar para proteger a nova rota

// Criação da tabela de tutores
db.run(`
  CREATE TABLE IF NOT EXISTS tutores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    contato TEXT NOT NULL,
    endereco TEXT NOT NULL,
    pets_associados TEXT
  )
`);

// Listar todos os tutores
router.get('/', verifyJWT, (req, res) => { // Adicionado verifyJWT por consistência, se aplicável
  db.all('SELECT * FROM tutores ORDER BY nome ASC', (err, tutores) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar tutores' });
    res.status(200).json(tutores);
  });
});

// Criar tutor
router.post('/', verifyJWT, (req, res) => { // Adicionado verifyJWT
  const { nome, contato, endereco, pets_associados } = req.body;
  db.run(
    'INSERT INTO tutores (nome, contato, endereco, pets_associados) VALUES (?, ?, ?, ?)',
    [nome, contato, endereco, pets_associados || ''], // Garante que pets_associados não seja null
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao criar tutor' });
      res.status(201).json({ id: this.lastID, message: 'Tutor criado com sucesso' });
    }
  );
});

// Buscar tutor por ID
router.get('/:id', verifyJWT, (req, res) => { // Adicionado verifyJWT
  db.get('SELECT * FROM tutores WHERE id = ?', [req.params.id], (err, tutor) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar tutor' });
    if (!tutor) return res.status(404).json({ error: 'Tutor não encontrado' });
    res.status(200).json(tutor);
  });
});

// Atualizar tutor
router.put('/:id', verifyJWT, (req, res) => { // Adicionado verifyJWT
  const { nome, contato, endereco, pets_associados } = req.body;
  db.run(
    'UPDATE tutores SET nome = ?, contato = ?, endereco = ?, pets_associados = ? WHERE id = ?',
    [nome, contato, endereco, pets_associados || '', req.params.id], // Garante que pets_associados não seja null
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao atualizar tutor' });
      if (this.changes === 0) return res.status(404).json({ error: 'Tutor não encontrado ou dados idênticos' });
      res.status(200).json({ message: 'Tutor atualizado com sucesso' });
    }
  );
});

// Deletar tutor
router.delete('/:id', verifyJWT, (req, res) => { // Adicionado verifyJWT (ou verifyAdmin se apropriado)
  db.run('DELETE FROM tutores WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao deletar tutor' });
    if (this.changes === 0) return res.status(404).json({ error: 'Tutor não encontrado' });
    res.status(200).json({ message: 'Tutor deletado com sucesso' });
  });
});


// NOVA ROTA: Buscar pets associados a um tutor específico
/**
 * @swagger
 * /tutors/{id}/pets:
 * get:
 * summary: Busca os pets associados a um tutor específico.
 * tags: [Tutors]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: ID do Tutor.
 * responses:
 * 200:
 * description: Lista de pets do tutor retornada com sucesso.
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Pet' # Assegure-se que o schema 'Pet' está definido no app.js
 * 404:
 * description: Tutor não encontrado ou não possui pets associados válidos.
 * 500:
 * description: Erro ao buscar pets do tutor.
 */
router.get('/:id/pets', verifyJWT, (req, res) => {
  const tutorId = req.params.id;

  db.get('SELECT pets_associados FROM tutores WHERE id = ?', [tutorId], (err, tutorRow) => {
    if (err) {
      console.error(`Erro ao buscar tutor ${tutorId} para pegar pets_associados: `, err);
      return res.status(500).json({ error: 'Erro ao buscar dados do tutor.' });
    }
    if (!tutorRow) {
      return res.status(404).json({ error: 'Tutor não encontrado.' });
    }

    if (!tutorRow.pets_associados || tutorRow.pets_associados.trim() === '') {
      // Tutor não tem pets associados, retorna array vazio
      return res.status(200).json([]);
    }

    const petIds = tutorRow.pets_associados.split(',')
                      .map(idStr => parseInt(idStr.trim(), 10))
                      .filter(id => !isNaN(id) && id > 0); // Garante que são IDs numéricos válidos e positivos

    if (petIds.length === 0) {
      return res.status(200).json([]); // Retorna array vazio se não houver IDs válidos após o parse
    }

    // Cria placeholders para a query IN (?, ?, ?)
    const placeholders = petIds.map(() => '?').join(',');
    // Seleciona apenas os campos necessários do pet para o dropdown
    const sql = `SELECT id, name, race FROM pets WHERE id IN (${placeholders}) ORDER BY name ASC`;

    db.all(sql, petIds, (errPets, pets) => {
      if (errPets) {
        console.error('Erro ao buscar pets pelos IDs associados ao tutor: ', errPets);
        return res.status(500).json({ error: 'Erro ao buscar pets associados.' });
      }
      res.status(200).json(pets || []); // Retorna os pets encontrados ou array vazio
    });
  });
});


module.exports = router;