var express = require('express');
var router = express.Router();
const { jwtDecode } = require('jwt-decode');
const backendProductsUrl = process.env.BACK_URL + "/products";

/* GET página para cliente selecionar produtos. */
router.get('/', function (req, res, next) {
  const title = "Nossos Produtos";
  const token = req.session.token || "";
  let currentUserRole = null;

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
      // Só permite acesso se não for admin
      if (currentUserRole === 'admin') {
        return res.redirect('/admin');
      }
    } catch (error) {
      console.error("Erro ao decodificar token na rota GET /produtos (frontend):", error);
      return res.redirect('/login');
    }
  } else {
    console.log("Usuário não logado tentando acessar /produtos. Redirecionando para /login.");
    return res.redirect('/login');
  }

  fetch(backendProductsUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  .then(async (apiRes) => {
    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta do servidor de produtos." }));
      if (apiRes.status === 401 || apiRes.status === 403) {
        console.log(`Backend retornou ${apiRes.status} para /products. Redirecionando para /login.`);
        return res.redirect('/login');
      }
      throw err;
    }
    return apiRes.json();
  })
  .then((produtos) => {
    res.render('layout', {
      body: 'pages/client-select-products',
      title: title,
      produtos: produtos || [],
      currentUserRole: currentUserRole,
      error: ""
    });
  })
  .catch((error) => {
    console.error('Erro ao buscar produtos para cliente (frontend catch):', error);
    res.render('layout', {
      body: 'pages/client-select-products',
      title: title,
      produtos: [],
      currentUserRole: currentUserRole,
      error: error.message || "Não foi possível carregar os produtos no momento."
    });
  });
});

module.exports = router;