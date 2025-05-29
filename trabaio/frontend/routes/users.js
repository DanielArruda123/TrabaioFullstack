var express = require('express');
var router = express.Router();
const { jwtDecode } = require('jwt-decode'); 
const url = process.env.BACK_URL + "/users"; // URL base para o backend de usuários

// Rota GET /users (para listar usuários - como modificamos antes)
// Mantenha o código da sua rota GET / aqui como já ajustamos
router.get('/',  function (req, res, next) {
  let title = "Gestão de Usuários";
  let cols = ["Nome", "Email", "Telefone", "Cargo", "Ações"]; // Ajuste as colunas conforme seu EJS
  const token = req.session.token || "";
  let currentUserRole = null;

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role;
      if (currentUserRole !== 'ADM') {
        console.log("Tentativa de acesso a /users por não ADM. Redirecionando para /");
        return res.redirect('/'); 
      }
    } catch (error) {
      console.error("Erro ao decodificar token na rota GET /users:", error);
      return res.redirect('/login'); 
    }
  } else {
    return res.redirect('/login');
  }
  
  fetch(url, {
    method: 'GET',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
  })
  .then(async (apiRes) => {
    if(!apiRes.ok){
      const err = await apiRes.json();
      if (apiRes.status === 401 || apiRes.status === 403) {
          return res.redirect('/login');
      }
      throw err;
    }
    return apiRes.json();
  })
  .then((users)=> {
    res.render('layout', {
        body:'pages/users', 
        title,
        cols, 
        users, 
        error: "", 
        currentUserRole: currentUserRole
    });
  })
 .catch((error)=> {
    console.log('Erro em GET /users (frontend):', error);
    res.render('layout', {
        body:'pages/users', 
        title, 
        cols, 
        users: [], 
        error: error, 
        currentUserRole: currentUserRole
    });
  });
});

// ==============================================================================
// ROTA POST /users (PARA O FORMULÁRIO DE CADASTRO)
// ==============================================================================
router.post("/", (req, res) => {
  // Os nomes aqui (username, password, email, phone) vêm dos atributos 'name'
  // do seu formulário de cadastro HTML, que ajustamos no Passo 5.1.
  const { username, password, email, phone } = req.body;
  
  // Chamada para a rota de registro do backend
  fetch(url + '/register', { // URL do backend: http://localhost:4000/users/register
    method: "POST",
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ username, password, email, phone }) // Envia os dados corretos
  })
  .then(async (apiRes) => {
    // Tenta ler o corpo da resposta como JSON, independentemente do status
    const responseBody = await apiRes.json().catch(() => ({ error: "Resposta inválida do servidor." })); 
    
    if (!apiRes.ok){
      // Joga o corpo da resposta (que deve conter o erro do backend) para o catch
      throw responseBody; 
    }
    return responseBody; // Contém a mensagem de sucesso do backend
  })
  .then((backendResponse) => {
    // Cadastro bem-sucedido no backend!
    // Redirecionar para a página de login com uma mensagem de sucesso na URL.
    res.redirect('/login?status=register_success');
  })
  .catch((errorFromBackend) =>{
    // Erro no cadastro (ex: usuário já existe, erro do servidor backend)
    const errorMessage = errorFromBackend.error || "Ocorreu um erro durante o cadastro. Tente novamente.";
    console.log("Erro no fetch de cadastro (frontend POST /users):", errorMessage);
    
    // Redireciona de volta para a página de login, passando a mensagem de erro via query parameter
    res.redirect(`/login?status=register_error&message=${encodeURIComponent(errorMessage)}`);
  });
});
// ==============================================================================

// Suas rotas PUT /:id, DELETE /:id, GET /:id que já existiam e foram ajustadas para token, continuam aqui.
// Vou colocar as versões que tínhamos antes para garantir a completude do arquivo:

// UPDATE USER
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { username, password, email, phone, role } = req.body;
  const token = req.session.token || ""; 

  if (!token) { 
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url+'/'+id, {
    method: "PUT",
    headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}` 
    }, 
    body: JSON.stringify({ username, password, email, phone, role })
  }).then(async (apiRes) => { 
    if (!apiRes.ok){ const err = await apiRes.json(); throw err; }
    return apiRes.json();
  }).then((user) => { res.send(user);
  }).catch((error) =>{ res.status(500).send(error); });
});

// DELETE USER
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || ""; 

  if (!token) { return res.status(401).send({ error: "Não autorizado: Token não fornecido" }); }
  
  fetch(url+'/'+id, {
    method: "DELETE",
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }).then(async (apiRes) => { 
    if (!apiRes.ok){ const err = await apiRes.json(); throw err; }
    return apiRes.json();
  }).then((user) => { res.send(user);
  }).catch((error) =>{ res.status(500).send(error); });
});

// GET USER BY ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || ""; 

  if (!token) { return res.status(401).send({ error: "Não autorizado: Token não fornecido" }); }

  fetch(url+'/'+id, {
    method: "GET",
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }).then(async (apiRes) => { 
    if (!apiRes.ok){ const err = await apiRes.json(); throw err; }
    return apiRes.json();
  }).then((user) => { res.send(user);
  }).catch((error) =>{ res.status(500).send(error); });
});

module.exports = router;