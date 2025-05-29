const express = require('express');
const router = express.Router();
const { jwtDecode } = require('jwt-decode'); // <<-- ADICIONADO
const url = process.env.BACK_URL + "/solicitations";

// GET solicitations listing
router.get('/', function (req, res, next) {
  const title = "Gestão de Solicitações";
  const cols = ["Tutor", "Pet", "Serviço", "Data/Hora", "Status", "Ações"];
  const token = req.session.token || "";
  let currentUserRole = null; // <<-- ADICIONADO

  if (token) { // <<-- ADICIONADO Bloco if/else
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
    } catch (error) {
      console.error("Erro ao decodificar token na rota '/solicitations':", error);
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
    .then(async (resApi) => {
      if (!resApi.ok) {
        const err = await resApi.json();
        if (resApi.status === 401 || resApi.status === 403) {
            return res.redirect('/login');
        }
        throw err;
      }
      return resApi.json();
    })
    .then((solicitations) => {
      res.render('layout', {
        body: 'pages/solicitations',
        title,
        cols,
        solicitations,
        error: "",
        currentUserRole: currentUserRole // <<-- MODIFICADO: Passando para a view
      });
    })
    .catch((error) => {
      console.error('Erro ao buscar solicitações:', error);
      res.redirect('/login');
    });
});

// POST new solicitation
router.post("/", (req, res) => {
  const { tutor, pet, servico, data_hora, status } = req.body;
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
    body: JSON.stringify({ tutor, pet, servico, data_hora, status })
  }).then(async (resApi) => {
    if (!resApi.ok) {
      const err = await resApi.json();
      throw err;
    }
    return resApi.json();
  })
    .then((solicitation) => {
      res.send(solicitation);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// PUT update solicitation
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { tutor, pet, servico, data_hora, status } = req.body;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // <<-- ADICIONADO header de autorização
    },
    body: JSON.stringify({ tutor, pet, servico, data_hora, status })
  }).then(async (resApi) => {
    if (!resApi.ok) {
      const err = await resApi.json();
      throw err;
    }
    return resApi.json();
  })
    .then((solicitation) => {
      res.send(solicitation);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// DELETE solicitation
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
  }).then(async (resApi) => {
    if (!resApi.ok) {
      const err = await resApi.json();
      throw err;
    }
    return resApi.json();
  })
    .then((solicitation) => {
      res.send(solicitation);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// GET solicitation by ID
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
      'Authorization': `Bearer ${token}` // <<-- ADICIONADO header de autorização
    }
  }).then(async (resApi) => {
    if (!resApi.ok) {
      const err = await resApi.json();
      throw err;
    }
    return resApi.json();
  })
    .then((solicitation) => {
      res.send(solicitation);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

module.exports = router;