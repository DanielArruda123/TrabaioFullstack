var express = require('express');
var router = express.Router();
var verifyJWT = require('../auth/verify-token'); // Verifique se este caminho está correto
const db = require('../database/config'); // Verifique se este caminho está correto

// Cria a tabela de solicitações, se não existir
db.run(`CREATE TABLE IF NOT EXISTS solicitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tutor TEXT,        -- Armazenará o ID do tutor
  pet TEXT,          -- Armazenará IDs dos pets como string CSV (ex: "1,2,3")
  servico TEXT,      -- Armazenará IDs dos serviços como string CSV (ex: "1,2")
  data_hora TEXT,
  status TEXT
)`, (err) => {
  if (err) {
    console.error('Erro CRÍTICO ao criar a tabela solicitations:', err.message);
  } else {
    console.log('Tabela solicitations verificada/criada com sucesso!');
  }
});

// Criar solicitação
router.post('/', verifyJWT, (req, res) => {
  const { tutor, pet, servico, data_hora, status } = req.body;

  if (!tutor) {
    return res.status(400).send({ error: 'O campo tutor (ID do tutor do formulário) é obrigatório para a solicitação.' });
  }
  if (typeof pet === 'undefined' || pet === null || String(pet).trim() === '') {
    return res.status(400).send({ error: 'O campo pet(s) é obrigatório para a solicitação.' });
  }
  if (typeof servico === 'undefined' || servico === null || String(servico).trim() === '') {
    return res.status(400).send({ error: 'O campo serviço(s) é obrigatório para a solicitação.' });
  }
  if (!data_hora) {
    return res.status(400).send({ error: 'O campo data e hora é obrigatório.' });
  }
  if (!status) {
    return res.status(400).send({ error: 'O campo status é obrigatório.' });
  }

  db.run(
    'INSERT INTO solicitations (tutor, pet, servico, data_hora, status) VALUES (?, ?, ?, ?, ?)',
    [tutor, pet, servico, data_hora, status],
    function(err) {
      if (err) {
        console.error('Erro ao criar a solicitação no banco:', err.message);
        return res.status(500).send({ error: 'Erro ao criar a solicitação no banco de dados.' });
      }
      res.status(201).send({
        id: this.lastID,
        tutor,
        pet,
        servico,
        data_hora,
        status,
        message: 'Solicitação criada com sucesso'
      });
    }
  );
});

// Listar todas as solicitações - COM CORREÇÕES PARA NOMES
router.get('/', verifyJWT, async (req, res) => {
  try {
    // 1. Buscar todas as solicitações
    const solicitations = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM solicitations ORDER BY id DESC', [], (err, rows) => {
        if (err) {
          console.error('Erro ao buscar as solicitações:', err.message);
          reject({ status: 500, error: 'Erro ao buscar as solicitações' });
        } else {
          resolve(rows);
        }
      });
    });

    // 2. Para cada solicitação, buscar os nomes correspondentes
    const enrichedSolicitations = await Promise.all(solicitations.map(async (solicitation) => {
      let tutorNome = `ID: ${solicitation.tutor}`;
      let petNomes = `IDs: ${solicitation.pet}`;
      let servicoNomes = `IDs: ${solicitation.servico}`;

      // Buscar nome do Tutor
      if (solicitation.tutor) {
        const tutorRow = await new Promise((resolve) => {
          db.get('SELECT nome FROM tutores WHERE id = ?', [solicitation.tutor], (err, row) => {
            if (err) {
              console.error(`Erro ao buscar nome do tutor ${solicitation.tutor}:`, err.message);
              resolve(null);
            } else {
              resolve(row);
            }
          });
        });
        if (tutorRow && tutorRow.nome) {
          tutorNome = tutorRow.nome;
        }
      }

      // Buscar nomes dos Pets
      if (solicitation.pet && solicitation.pet.trim() !== '') {
        const petIds = solicitation.pet.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id) && id > 0);
        if (petIds.length > 0) {
          const placeholders = petIds.map(() => '?').join(',');
          const petRows = await new Promise((resolve) => {
            // ***** MODIFICAÇÃO 1 AQUI *****
            db.all(`SELECT name FROM pets WHERE id IN (${placeholders})`, petIds, (err, rows) => {
              if (err) {
                console.error(`Erro ao buscar nomes dos pets [${petIds.join(',')}]:`, err.message);
                resolve([]);
              } else {
                resolve(rows);
              }
            });
          });
          if (petRows.length > 0) {
            // ***** MODIFICAÇÃO 2 AQUI *****
            petNomes = petRows.map(p => p.name).join(', ');
          } else {
            petNomes = "Pets não encontrados";
          }
        } else {
          petNomes = "Nenhum pet ID válido";
        }
      } else {
        petNomes = "Nenhum pet associado";
      }

      // Buscar nomes dos Serviços
      if (solicitation.servico && solicitation.servico.trim() !== '') {
        const servicoIds = solicitation.servico.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id) && id > 0);
        if (servicoIds.length > 0) {
          const placeholders = servicoIds.map(() => '?').join(',');
          const servicoRows = await new Promise((resolve) => {
            db.all(`SELECT nome FROM servicos WHERE id IN (${placeholders})`, servicoIds, (err, rows) => {
              if (err) {
                console.error(`Erro ao buscar nomes dos serviços [${servicoIds.join(',')}]:`, err.message);
                resolve([]);
              } else {
                resolve(rows);
              }
            });
          });
          if (servicoRows.length > 0) {
            servicoNomes = servicoRows.map(s => s.nome).join(', ');
          } else {
            servicoNomes = "Serviços não encontrados";
          }
        } else {
          servicoNomes = "Nenhum ID de serviço válido";
        }
      } else {
        servicoNomes = "Nenhum serviço associado";
      }

      return {
        ...solicitation,
        tutor_nome: tutorNome,
        pet_nomes: petNomes,
        servico_nomes: servicoNomes
      };
    }));

    res.status(200).send(enrichedSolicitations);

  } catch (error) {
    console.error('Erro geral ao buscar e enriquecer solicitações:', error);
    res.status(error.status || 500).send({ error: error.error || error.message || 'Erro ao processar solicitações' });
  }
});

// Buscar solicitação por ID
router.get('/:id', (req, res) => { // Considerar adicionar verifyJWT se necessário
  const { id } = req.params;
  db.get('SELECT * FROM solicitations WHERE id = ?', [id], (err, solicitation) => {
    if (err) {
      console.error('Erro ao buscar a solicitação por ID:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar a solicitação' });
    }
    if (!solicitation) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    // Aqui você poderia também enriquecer a solicitação individual com nomes, se necessário para uma view de detalhes
    res.status(200).json(solicitation);
  });
});

// Atualizar completamente uma solicitação (PUT)
router.put('/:id', verifyJWT, (req, res) => { // Adicionado verifyJWT para consistência, ajuste se não for necessário
  const { id } = req.params;
  const { tutor, pet, servico, data_hora, status } = req.body;

  if (typeof tutor === 'undefined' || tutor === null ||
      typeof pet === 'undefined' || pet === null ||
      typeof servico === 'undefined' || servico === null ||
      !data_hora || !status) {
    return res.status(400).json({ error: 'Todos os campos (tutor, pet, servico, data_hora, status) são obrigatórios para atualização completa.' });
  }

  db.run(
    'UPDATE solicitations SET tutor = ?, pet = ?, servico = ?, data_hora = ?, status = ? WHERE id = ?',
    [tutor, pet, servico, data_hora, status, id],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar a solicitação:', err.message);
        return res.status(500).json({ error: 'Erro ao atualizar a solicitação' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Solicitação não encontrada ou nenhum dado alterado' });
      }
      res.status(200).json({
        id: parseInt(id),
        tutor, pet, servico, data_hora, status,
        message: 'Solicitação atualizada com sucesso'
      });
    }
  );
});

// Atualizar parcialmente uma solicitação (PATCH)
router.patch('/:id', verifyJWT, (req, res) => { // Adicionado verifyJWT, ajuste se não for necessário
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
  }

  const allowedFields = ['tutor', 'pet', 'servico', 'data_hora', 'status'];
  const setParts = [];
  const finalValues = [];

  keys.forEach((key, index) => {
    if (allowedFields.includes(key)) {
      setParts.push(`${key} = ?`);
      finalValues.push(values[index]);
    }
  });

  if (setParts.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo válido ou permitido fornecido para atualização.' });
  }

  const setClause = setParts.join(', ');
  finalValues.push(id);

  db.run(`UPDATE solicitations SET ${setClause} WHERE id = ?`, finalValues, function (err) {
    if (err) {
      console.error('Erro ao atualizar a solicitação parcialmente:', err.message);
      return res.status(500).json({ error: 'Erro ao atualizar a solicitação parcialmente' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada ou nenhum dado alterado' });
    }
    res.status(200).json({ message: 'Solicitação atualizada parcialmente com sucesso' });
  });
});

// Deletar uma solicitação
router.delete('/:id', verifyJWT, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM solicitations WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao deletar a solicitação:', err.message);
      return res.status(500).json({ error: 'Erro ao deletar a solicitação.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    res.status(200).json({ message: 'Solicitação deletada com sucesso' });
  });
});

module.exports = router;