const express = require('express');
const router = express.Router();
const { jwtDecode } = require('jwt-decode'); // <<-- ADICIONADO
const url = "http://localhost:4000/services";

/* GET services listing */
router.get('/', function (req, res, next) {
  const title = "Gestão de Serviços";
  const cols = ["Nome", "Descrição", "Preço", /*"Duração",*/ "Ações"]; // Removi Duração da lista de colunas, pois não existe na tabela do backend
  const token = req.session.token || "";
  let currentUserRole = null; // <<-- ADICIONADO

  if (token) { // <<-- ADICIONADO Bloco if/else
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
    } catch (error) {
      console.error("Erro ao decodificar token na rota '/services':", error);
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
    .then((services) => {
      res.render('layout', {
        body: 'pages/services',
        title,
        cols,
        services,
        error: "",
        currentUserRole: currentUserRole // <<-- MODIFICADO: Passando para a view
      });
    })
    .catch((error) => {
      console.error('Erro ao buscar serviços:', error);
      res.redirect('/login');
    });
});

// POST new service
router.post("/", (req, res) => {
  // O campo 'duracao' não existe na tabela 'servicos' do backend
  // Portanto, não deve ser enviado no corpo da requisição, a menos que o backend seja alterado.
  const { nome, descricao, preco /*, duracao */ } = req.body; 
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
    // Removido 'duracao' do corpo, pois não existe no backend
    body: JSON.stringify({ nome, descricao, preco }) 
  }).then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
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
  // O campo 'duracao' não existe na tabela 'servicos' do backend
  const { nome, descricao, preco /*, duracao */ } = req.body;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    // A rota PUT no backend não tem verifyJWT. Se precisar, adicione lá.
    // Mesmo assim, é bom verificar o token no frontend para operações de modificação.
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(`${url}/${id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // <<-- ADICIONADO header de autorização
    },
    // Removido 'duracao' do corpo
    body: JSON.stringify({ nome, descricao, preco })
  }).then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
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
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    // A rota GET /:id no backend não tem verifyJWT. Se precisar, adicione lá.
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(`${url}/${id}`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // <<-- ADICIONADO header de autorização
    }
  }).then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
  })
    .then((service) => {
      res.send(service);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

module.exports = router;