var express = require('express');
var router = express.Router();
const url = "http://localhost:4000/products";

/* GET products listing. */
router.get('/', function (req, res, next) {
  let title = "Gestão de Produtos";
  let cols = ["Nome", "Descrição", "Preço", "Estoque", "Categoria", "Ações"];

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
    .then((products) => {
      res.render('layout', { body: 'pages/products', title, cols, products, error: "" });
    })
    .catch((error) => {
      console.error('Erro:', error);
      res.redirect('/login');
    });
});

// POST NEW PRODUCT
router.post("/", (req, res) => {
  const { nome, descricao, preco, estoque, categoria } = req.body;
  const token = req.session.token || "";

  fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nome, descricao, preco, estoque, categoria })
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
  })
    .then((product) => {
      res.send(product);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// UPDATE PRODUCT
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, estoque, categoria } = req.body;

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, descricao, preco, estoque, categoria })
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    return res.json();
  })
    .then((product) => {
      res.send(product);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// DELETE PRODUCT
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
    .then((product) => {
      res.send(product);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// GET PRODUCT BY ID
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
    .then((product) => {
      res.send(product);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

module.exports = router;
