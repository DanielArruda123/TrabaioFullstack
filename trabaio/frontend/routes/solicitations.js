const express = require('express');
const router = express.Router();
const url = "http://localhost:4000/solicitations";

// GET solicitations listing
router.get('/', function (req, res, next) {
  const title = "Gestão de Solicitações";
  const cols = ["Tutor", "Pet", "Serviço", "Data/Hora", "Status", "Ações"];
  const token = req.session.token || "";

  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async (resApi) => {
      if (!resApi.ok) {
        const err = await resApi.json();
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
        error: ""
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
  const token = req.session.token || "";

  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
  const token = req.session.token || "";

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
  const token = req.session.token || "";

  fetch(`${url}/${id}`, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
  const token = req.session.token || "";

  fetch(`${url}/${id}`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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