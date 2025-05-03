var express = require('express');
var router = express.Router();
const url = "/users"; // Corrigido 'cons' para 'const'

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

router.post("/", (req, res) => {
  const { username, password, email, phone } = req.body;
  fetch(url + '/register', {
    method: "POST",
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ username, password, email, phone })
  })
}

module.exports = router;