const express = require('express');
const router = express.Router();
const url = "http://localhost:4000/solicitations";

/* GET solicitations listing */
router.get('/', function (req, res, next) {
  const title = "Gestão de Solicitações";
  const cols = ["ID Tutor", "ID Serviço", "Data", "Status", "Observações", "Ações"];
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
  const { id_tutor, id_servico, data, status, observacoes } = req.body;
  const token = req.session.token || "";

  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ id_tutor, id_servico, data, status, observacoes })
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
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
  const { id_tutor, id_servico, data, status, observacoes } = req.body;

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id_tutor, id_servico, data, status, observacoes })
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
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
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
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
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
  })
    .then((solicitation) => {
      res.send(solicitation);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

module.exports = router;
