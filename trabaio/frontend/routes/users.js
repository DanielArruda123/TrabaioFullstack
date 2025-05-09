var express = require('express');
var router = express.Router();
const url = "/users/"; // URL base para a API de usuários

/* GET users listing. */
router.get('/', async function (req, res, next) {
  try {
    // Fazendo a requisição para a URL
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const users = await response.json(); // Obtendo os dados dos usuários

    // Renderizando a página com os dados
    const title = "Gestão de Usuários";
    const cols = ["Id", "Nome", "Senha", "Email", "Telefone", "Ações"];
    res.render('users', { title, users, cols, error: "" });
  } catch (error) {
    console.error('Erro:', error);

    // Renderizando a página com erro
    res.status(500).render('users', { 
      title: "Gestão de Usuários", 
      users: [], 
      cols: ["Id", "Nome", "Senha", "Email", "Telefone", "Ações"], 
      error: "Ocorreu um erro ao buscar os usuários." 
    });
  }
});

//Criar
router.post("/", (req, res) => {
  const { username, password, email, phone } = req.body;
  fetch(url + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email, phone })
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    })
    .then((user) => {
      res.send(user);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

//Update
router.put("/:id", (req, res) => {
  const {id} =  req.params
  const { username, password, email, phone } = req.body;
  fetch(url+id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email, phone })
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    })
    .then((user) => {
      res.send(user);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

//Deletar usuario
router.delete("/:id", (req, res) => {
  const {id} =  req.params
  fetch(url+id, {
    method: "DELETE",
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    })
    .then((user) => {
      res.send(user);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

//Deletar usuario
router.get("/:id", (req, res) => {
  const {id} =  req.params
  fetch(url+id, {
    method: "GET",
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        throw err;
      }
      return res.json();
    })
    .then((user) => {
      res.send(user);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

module.exports = router;