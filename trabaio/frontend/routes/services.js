const express = require('express');
const router = express.Router();
const { jwtDecode } = require('jwt-decode');
const url = process.env.BACK_URL + "/services";

/* GET services listing. */
router.get('/', function (req, res, next) {
  let title = "Gestão de Serviços";
  let cols = ["Nome", "Descrição", "Preço", "Ações"];
  const token = req.session.token || "";
  let currentUserRole = null;

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
      
      // VERIFICAÇÃO DE ADM (similar ao que foi feito em users.js)
      if (currentUserRole !== 'ADM') {
        console.log("Tentativa de acesso a /services por não ADM. Redirecionando para /");
        return res.redirect('/'); // Redireciona para a página inicial se não for ADM
      }

    } catch (error) {
      console.error("Erro ao decodificar token na rota GET /services:", error);
      return res.redirect('/login'); // Redireciona para login se houver erro no token
    }
  } else {
    // Sem token, usuário não logado, redirecionar para login
    return res.redirect('/login');
  }
  
  // Fetch para o backend (protegido por token no backend)
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`
    }
  })
  .then(async (apiRes) => {
    if(!apiRes.ok){
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta do servidor." }));
      // Se o backend retornar 401 (Não Autorizado) ou 403 (Proibido), redireciona para login
      // Isso pode acontecer se o token expirou ou é inválido no backend.
      if (apiRes.status === 401 || apiRes.status === 403) {
          return res.redirect('/login');
      }
      throw err; // Lança outros erros para o .catch()
    }
    return apiRes.json();
  })
  .then((services)=> {
    res.render('layout', {
        body:'pages/services', 
        title, 
        cols, 
        services, 
        error: "", 
        currentUserRole: currentUserRole // Passa a role para a view (já sabemos que é ADM aqui)
    });
  })
  .catch((error)=> {
    console.error('Erro em GET /services (frontend):', error);
    // Para outros erros (ex: backend offline), pode ser melhor uma página de erro
    // Mas, por enquanto, redirecionamos para o login com uma mensagem de erro
    res.redirect('/login?error=' + encodeURIComponent(error.message || 'Erro ao carregar serviços.'));
  });
});

// POST NEW SERVICE
router.post("/", (req, res) => {
  const { nome, descricao, preco } = req.body;
  const token = req.session.token || ""; 

  if (!token) { 
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }
  // A proteção de role ADM para esta ação será feita no backend

  fetch(url, {
    method: "POST",
    headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}` 
    }, 
    body: JSON.stringify({ nome, descricao, preco }) 
  }).then(async (apiRes) => { 
    if (!apiRes.ok){
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta do servidor." }));
      throw err; // Lança o erro para o catch
    }
    return apiRes.json();
  })
  .then((service) => { 
    res.status(201).send(service); // Retorna 201 para criação bem-sucedida
  })
  .catch((error) =>{
    // Envia o status e mensagem de erro do backend, se disponíveis
    res.status(error.status || 500).send({ error: error.message || error.error || "Erro ao criar serviço" });
  });
});

// UPDATE SERVICE
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco } = req.body;
  const token = req.session.token || ""; 

  if (!token) { 
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }
  // A proteção de role ADM para esta ação será feita no backend

  fetch(url + '/' + id, { // Corrigido para url + '/' + id
    method: "PUT",
    headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}` 
    }, 
    body: JSON.stringify({ nome, descricao, preco })
  }).then(async (apiRes) => { 
    if (!apiRes.ok){
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta do servidor." }));
      throw err; // Lança o erro para o catch
    }
    return apiRes.json();
  })
  .then((service) => {
    res.send(service);
  })
  .catch((error) =>{
    res.status(error.status || 500).send({ error: error.message || error.error || "Erro ao atualizar serviço" });
  });
});

// DELETE SERVICE
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || ""; 

  if (!token) { 
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }
  // A proteção de role ADM para esta ação será feita no backend

  fetch(url + '/' + id, { // Corrigido para url + '/' + id
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    }
  }).then(async (apiRes) => { 
    if (!apiRes.ok){ 
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta do servidor." }));
      throw err; // Lança o erro para o catch
    }
    return apiRes.json();
  })
  .then((service) => {
    res.send(service);
  })
  .catch((error) =>{
    res.status(error.status || 500).send({ error: error.message || error.error || "Erro ao deletar serviço" });
  });
});

// GET SERVICE BY ID (para formulário de edição, por exemplo)
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || ""; 

  if (!token) { 
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }
  // A proteção de role ADM para esta ação será feita no backend

  fetch(url + '/' + id, { // Corrigido para url + '/' + id
    method: "GET",
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    }
  }).then(async (apiRes) => { 
    if (!apiRes.ok){ 
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta do servidor." }));
      // Se o backend retornar 401 ou 403 ao buscar um serviço específico para edição,
      // pode ser um indicativo de que o usuário não tem permissão (ou o token expirou).
      // Aqui, em vez de redirecionar, enviamos o erro, pois é uma chamada de API (fetch).
      // A página que chamou este GET /:id deve tratar o erro.
      throw err; 
    }
    return apiRes.json();
  })
  .then((service) => {
    res.send(service);
  })
  .catch((error) =>{
    res.status(error.status || 500).send({ error: error.message || error.error || "Erro ao buscar serviço" });
  });
});

module.exports = router;