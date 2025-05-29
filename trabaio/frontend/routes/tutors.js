const express = require('express');
const router = express.Router();
const { jwtDecode } = require('jwt-decode'); // <<-- ADICIONADO
const url = process.env.BACK_URL + "/tutors";

// Listar todos os tutores
router.get('/', function (req, res) {
  let title = "Gestão de Tutores";
  let cols = ["Nome", "Contato", "Endereço", "Pets Associados", "Ações"];
  const token = req.session.token || "";
  let currentUserRole = null; // <<-- ADICIONADO

  if (token) { // <<-- ADICIONADO Bloco if/else
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
    } catch (error) {
      console.error("Erro ao decodificar token na rota '/tutors':", error);
      return res.redirect('/login');
    }
  } else {
    return res.redirect('/login');
  }

  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Token é enviado
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        if (response.status === 401 || response.status === 403) {
            return res.redirect('/login');
        }
        throw err;
      }
      return response.json();
    })
    .then((tutors) => {
      res.render('layout', { 
          body: 'pages/tutors', 
          title, 
          cols, 
          tutors, 
          error: "", 
          currentUserRole: currentUserRole // <<-- MODIFICADO: Passando para a view
        });
    })
    .catch((error) => {
      console.error('Erro ao buscar tutores:', error);
      res.redirect('/login');
    });
});

// Criar novo tutor
router.post("/", (req, res) => {
  const { nome, contato, endereco, pets_associados } = req.body;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Header já existia e estava correto
    },
    body: JSON.stringify({ nome, contato, endereco, pets_associados })
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        throw err;
      }
      return response.json();
    })
    .then((tutor) => {
      res.send(tutor);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// Atualizar tutor (PUT)
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nome, contato, endereco, pets_associados } = req.body;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Header já existia e estava correto
    },
    body: JSON.stringify({ nome, contato, endereco, pets_associados })
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        throw err;
      }
      return response.json();
    })
    .then((tutor) => {
      res.send(tutor);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// Deletar tutor
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(`${url}/${id}`, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Header já existia e estava correto
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        throw err;
      }
      return response.json();
    })
    .then((tutor) => {
      res.send(tutor);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// Buscar tutor por ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(`${url}/${id}`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Header já existia e estava correto
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        throw err;
      }
      return response.json();
    })
    .then((tutor) => {
      res.send(tutor);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

module.exports = router;