var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');

// GET home page.
const url = "http://localhost:4000/auth/login";
router.get('/', function(req, res, next) {
  res.render('layout', { body: 'pages/login', title: 'Express' });
});

router.post('/', function(req, res, next) {
  console.log('Dados do formulário:', req.body);
  
  const loginData = {
    username: req.body.username,
    password: req.body.password
  };

  console.log('Dados enviados para o backend:', loginData);

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  })
  .then(async (response) => {
    console.log('Status da resposta:', response.status);
    const data = await response.json();
    console.log('Resposta do servidor:', data);

    if(!response.ok){
      throw data;
    }
    return data;
  })
  .then((data) => {
    console.log('Login bem sucedido, redirecionando...');
    req.session.token = data.token;
    res.redirect('/pets');
  })
  .catch((error) => {
    console.log('Erro no login:', error);
    res.render('layout', {
      body: 'pages/login',
      title: 'Express', 
      error: error.error || 'Erro ao fazer login'
    });
  });
});

module.exports = router;