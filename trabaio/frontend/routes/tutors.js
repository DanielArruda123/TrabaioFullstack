const express = require('express');
const router = express.Router();
const { jwtDecode } = require('jwt-decode');
const tutorsBackendUrl = process.env.BACK_URL + "/tutors";
const petsBackendUrl = process.env.BACK_URL + "/pets";

// Listar todos os tutores E CARREGAR DADOS PARA O FORMULÁRIO (PETS DISPONÍVEIS)
router.get('/', async function (req, res, next) {
  let title = "Gestão de Tutores";
  let cols = ["Nome", "Contato", "Endereço", "Pets Associados", "Ações"];
  const token = req.session.token || "";
  let currentUserRole = null;

  if (!token) {
    return res.redirect('/login');
  }
  try {
    const decodedToken = jwtDecode(token);
    currentUserRole = decodedToken.role;
  } catch (error) {
    console.error("Erro ao decodificar token na rota '/tutors':", error);
    return res.redirect('/login');
  }

  try {
    // 1. Fetch para buscar a lista de tutores
    const tutorsResponse = await fetch(tutorsBackendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!tutorsResponse.ok) {
      const errTutors = await tutorsResponse.json().catch(() => ({ error: "Erro ao processar resposta de tutores." }));
      if (tutorsResponse.status === 401 || tutorsResponse.status === 403) {
        return res.redirect('/login');
      }
      throw errTutors;
    }
    const tutors = await tutorsResponse.json();

    // 2. Fetch para buscar a lista de pets DISPONÍVEIS para um NOVO tutor
    // ADICIONADO O PARÂMETRO ?forTutorForm=true
    const petsResponse = await fetch(`${petsBackendUrl}?forTutorForm=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    let pets = [];
    if (petsResponse.ok) {
      pets = await petsResponse.json();
    } else {
      console.warn(`Erro ao buscar pets disponíveis para o formulário de tutores (GET /): ${petsResponse.statusText}`);
      if (petsResponse.status === 401 || petsResponse.status === 403) {
        return res.redirect('/login');
      }
      // Permite que a página carregue sem pets se a busca falhar por outros motivos
    }

    res.render('layout', {
      body: 'pages/tutors',
      title,
      cols,
      tutors,
      pets: pets || [], // Passa a lista de pets (agora filtrada para 'disponíveis')
      error: "",
      currentUserRole: currentUserRole
    });

  } catch (error) {
    console.error('Erro ao buscar dados para /tutors (frontend):', error);
    res.render('layout', {
      body: 'pages/tutors',
      title,
      cols,
      tutors: [],
      pets: [],
      error: error.message || "Erro ao carregar dados da página de tutores.",
      currentUserRole: currentUserRole
    });
  }
});

// Criar novo tutor (sem alterações aqui, a lógica de conversão de array para CSV está OK)
router.post("/", (req, res) => {
  let { nome, contato, endereco, pets_associados } = req.body;
  const token = req.session.token || "";

  if (!token) {
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  if (Array.isArray(pets_associados)) {
    pets_associados = pets_associados.join(',');
  } else if (typeof pets_associados === 'undefined' || pets_associados === null) {
    pets_associados = '';
  }

  fetch(tutorsBackendUrl, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nome, contato, endereco, pets_associados })
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro ao processar resposta do servidor."}));
        throw err;
      }
      return response.json();
    })
    .then((tutor) => {
      res.send(tutor);
    })
    .catch((error) => {
      console.error("Erro ao criar tutor (frontend):", error);
      res.status(error.status || 500).send({ error: error.message || error.error || "Erro interno ao criar tutor."});
    });
});

// Atualizar tutor (PUT) (sem alterações aqui, a lógica de conversão de array para CSV está OK)
router.put("/:id", (req, res) => {
  const { id } = req.params;
  let { nome, contato, endereco, pets_associados } = req.body;
  const token = req.session.token || "";

  if (!token) {
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  if (Array.isArray(pets_associados)) {
    pets_associados = pets_associados.join(',');
  } else if (typeof pets_associados === 'undefined' || pets_associados === null) {
    pets_associados = '';
  }

  fetch(`${tutorsBackendUrl}/${id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nome, contato, endereco, pets_associados })
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro ao processar resposta do servidor."}));
        throw err;
      }
      return response.json();
    })
    .then((tutor) => {
      res.send(tutor);
    })
    .catch((error) => {
      console.error("Erro ao atualizar tutor (frontend):", error);
      res.status(error.status || 500).send({ error: error.message || error.error || "Erro interno ao atualizar tutor."});
    });
});

// Deletar tutor (sem alterações aqui)
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || "";

  if (!token) {
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(`${tutorsBackendUrl}/${id}`, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro ao processar resposta do servidor."}));
        throw err;
      }
      return response.json().catch(() => ({ message: 'Tutor deletado com sucesso' }));
    })
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.error("Erro ao deletar tutor (frontend):", error);
      res.status(error.status || 500).send({ error: error.message || error.error || "Erro interno ao deletar tutor."});
    });
});

// Buscar tutor por ID (para edição - esta rota já está correta usando editingTutorId)
router.get("/:id", async (req, res, next) => {
    const { id } = req.params; // ID do tutor sendo editado
    const token = req.session.token || "";
    let currentUserRole = null;

    if (!token) {
        return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
    }
    try {
        const decodedToken = jwtDecode(token);
        currentUserRole = decodedToken.role;
    } catch (error) {
        console.error("Erro ao decodificar token na rota GET /tutors/:id:", error);
        return res.status(401).send({ error: "Token inválido ou expirado." });
    }

    try {
        // 1. Fetch para buscar o tutor específico
        const tutorResponse = await fetch(`${tutorsBackendUrl}/${id}`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (!tutorResponse.ok) {
            const errTutor = await tutorResponse.json().catch(() => ({ error: "Tutor não encontrado ou erro no servidor."}));
            if (tutorResponse.status === 401 || tutorResponse.status === 403) {
                return res.status(tutorResponse.status).send(errTutor);
            }
            throw errTutor;
        }
        const tutor = await tutorResponse.json();

        // 2. Fetch para buscar a lista de pets apropriada para edição
        // Passa o ID do tutor que está sendo editado para o backend
        const petsForEditResponse = await fetch(`${petsBackendUrl}?editingTutorId=${id}`, { // CORRETO
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        
        let petsForSelect = [];
        if (petsForEditResponse.ok) {
            petsForSelect = await petsForEditResponse.json();
        } else {
            console.warn(`Erro ao buscar lista de pets para edição do tutor ${id}: ${petsForEditResponse.statusText}. Tentando buscar todos os pets como fallback.`);
            const allPetsFallbackResp = await fetch(petsBackendUrl, { headers: { 'Authorization': `Bearer ${token}` }});
            if (allPetsFallbackResp.ok) {
                petsForSelect = await allPetsFallbackResp.json();
            } else {
                console.error(`Erro ao buscar todos os pets como fallback para tutor ${id}: ${allPetsFallbackResp.statusText}`);
            }
        }
        
        res.send({ tutor, pets: petsForSelect || [], currentUserRole });

    } catch (error) {
        console.error(`Erro ao buscar dados para edição do tutor ${id} (frontend):`, error);
        res.status(error.status || 500).send({ error: error.message || error.error || "Erro interno ao buscar dados para edição do tutor."});
    }
});

module.exports = router;