var express = require('express');
var router = express.Router();
const { jwtDecode } = require('jwt-decode'); // <<-- ADICIONADO
const url = process.env.BACK_URL + "/products";

/* GET products listing. */
router.get('/', function (req, res, next) {
  let title = "Gestão de Produtos";
  let cols = ["Nome", "Descrição", "Preço", "Estoque", "Categoria", "Ações"];
  const token = req.session.token || "";
  let currentUserRole = null; // <<-- ADICIONADO

  if (token) { // <<-- ADICIONADO Bloco if/else
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
    } catch (error) {
      console.error("Erro ao decodificar token na rota '/products':", error);
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
  .then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json();
      if (apiRes.status === 401 || apiRes.status === 403) {
          return res.redirect('/login');
      }
      throw err;
    }
    return apiRes.json();
  })
  .then((products) => {
    res.render('layout', { 
        body: 'pages/products', 
        title, 
        cols, 
        products, 
        error: "", 
        currentUserRole: currentUserRole // <<-- MODIFICADO: Passando para a view
    });
  })
  .catch((error) => {
    console.error('Erro em /products GET:', error);
    res.redirect('/login');
  });
});

// POST NEW PRODUCT
router.post("/", (req, res) => {
  const { nome, descricao, preco, estoque, categoria } = req.body;
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
    body: JSON.stringify({ nome, descricao, preco, estoque, categoria })
  }).then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
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
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}` // <<-- ADICIONADO header de autorização
    },
    body: JSON.stringify({ nome, descricao, preco, estoque, categoria })
  }).then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
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
  }).then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
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
  }).then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
  })
  .then((product) => {
    res.send(product);
  })
  .catch((error) => {
    res.status(500).send(error);
  });
});

module.exports = router;