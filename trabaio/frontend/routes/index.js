var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');
const url = "http://localhost:4000/auth";

// GET home page.
router.get('/', function(req, res, next) {
  res.render('layout', { 
    body: 'pages/index', 
    title: 'Home'
  });
});

// GET login page
router.get('/login', function(req, res) {
  res.render('layout', {
    body: 'pages/login',
    title: 'Login',
    error: null
  });
});

// Rota para processar o login
router.post('/login', async function(req, res) {
  const { email, password } = req.body;

  try {
    const response = await fetch(`${url}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao fazer login');
    }

    // Salva o token na sessão
    req.session.token = data.token;
    
    // Redireciona para a página de pets
    res.redirect('/pets');
  } catch (error) {
    res.render('layout', {
      body: 'pages/login',
      title: 'Login',
      error: error.message
    });
  }
});

module.exports = router;
