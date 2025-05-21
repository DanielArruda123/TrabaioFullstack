var express = require('express');
var router = express.Router();
const url = "http://localhost:4000/tutors"; // Ajuste a URL da sua API

// Listar todos os tutores
router.get('/', function (req, res) {
  let title = "Gestão de Tutores";
  let cols = ["Nome", "Contato", "Endereço", "Pets Associados", "Ações"];
  const token = req.session.token || "";

  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        throw err;
      }
      return response.json();
    })
    .then((tutors) => {
      res.render('layout', { body: 'pages/tutors', title, cols, tutors, error: "" });
    })
    .catch((error) => {
      console.error('Erro:', error);
      res.redirect('/login');
    });
});

// Criar novo tutor
router.post("/", (req, res) => {
  const { nome, contato, endereco, pets_associados } = req.body;
  const token = req.session.token || "";

  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
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
  const token = req.session.token || "";

  fetch(`${url}/${id}`, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
  const token = req.session.token || "";

  fetch(`${url}/${id}`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
