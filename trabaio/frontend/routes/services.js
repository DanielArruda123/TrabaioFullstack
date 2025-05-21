const express = require('express');
const router = express.Router();
const url = "http://localhost:4000/services";

/* GET services listing */
router.get('/', function (req, res, next) {
  const title = "Gestão de Serviços";
  const cols = ["Nome", "Descrição", "Preço", "Duração", "Ações"];
  const token = req.session.token || "";

  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    })
    .then((services) => {
      res.render('layout', {
        body: 'pages/services',
        title,
        cols,
        services,
        error: ""
      });
    })
    .catch((error) => {
      console.error('Erro ao buscar serviços:', error);
      res.redirect('/login');
    });
});

// POST new service
router.post("/", (req, res) => {
  const { nome, descricao, preco, duracao } = req.body;
  const token = req.session.token || "";

  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nome, descricao, preco, duracao })
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
  })
    .then((service) => {
      res.send(service);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// PUT update service
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, duracao } = req.body;

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nome, descricao, preco, duracao })
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
  })
    .then((service) => {
      res.send(service);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// DELETE service
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || "";

  fetch(`${url}/${id}`, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
  })
    .then((service) => {
      res.send(service);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// GET service by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || "";

  fetch(`${url}/${id}`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
  })
    .then((service) => {
      res.send(service);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

module.exports = router;
