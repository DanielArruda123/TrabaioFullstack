var express = require('express');
var router = express.Router();
const { jwtDecode } = require('jwt-decode');
const backendServicesUrl = process.env.BACK_URL + "/services";

/* GET página para cliente selecionar serviços. */
router.get('/', function (req, res, next) {
  // ... (código existente da rota GET /)
  // ... (nenhuma alteração aqui)
  const title = "Nossos Serviços";
  const token = req.session.token || "";
  let currentUserRole = null;

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
    } catch (error) {
      console.error("Erro ao decodificar token na rota GET /selecionar-servicos (frontend):", error);
      return res.redirect('/login');
    }
  } else {
    console.log("Usuário não logado tentando acessar /selecionar-servicos. Redirecionando para /login.");
    return res.redirect('/login');
  }

  fetch(backendServicesUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  .then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta do servidor de serviços." }));
      if (apiRes.status === 401 || apiRes.status === 403) {
        console.log(`Backend retornou ${apiRes.status} para /services. Redirecionando para /login.`);
        return res.redirect('/login');
      }
      throw err;
    }
    return apiRes.json();
  })
  .then((services) => {
    res.render('layout', {
      body: 'pages/client-select-services',
      title: title,
      services: services || [],
      currentUserRole: currentUserRole,
      error: ""
    });
  })
  .catch((error) => {
    console.error('Erro ao buscar serviços para cliente (frontend catch):', error);
    res.render('layout', {
      body: 'pages/client-select-services',
      title: title,
      services: [],
      currentUserRole: currentUserRole,
      error: error.message || "Não foi possível carregar os serviços no momento."
    });
  });
});


// NOVA ROTA: GET /cart - Para exibir a página do carrinho
router.get('/cart', function(req, res, next) {
  const token = req.session.token || "";
  let currentUserRole = null;

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
    } catch (error) {
      console.error("Erro ao decodificar token na rota GET /userservices/cart:", error);
      return res.redirect('/login');
    }
  } else {
    return res.redirect('/login');
  }

  // Os dados do carrinho virão do localStorage no lado do cliente,
  // então não precisamos buscar nada do backend para esta página por enquanto.
  // Apenas renderizamos a view.
  res.render('layout', {
    body: 'pages/cart', // Nova view que vamos criar
    title: 'Meu Carrinho',
    currentUserRole: currentUserRole,
    error: ""
    // Não precisa passar os itens do carrinho aqui, pois o JavaScript na view 'cart.ejs'
    // vai ler do localStorage.
  });
});

module.exports = router;