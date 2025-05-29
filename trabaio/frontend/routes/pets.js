  var express = require('express');
var router = express.Router();
const { jwtDecode } = require('jwt-decode'); // <<-- ADICIONADO
const url = process.env.BACK_URL + "/pets";

/* GET pets listing. */
router.get('/',  function (req, res, next) {
  let title = "Gestão de Pets";
  let cols = ["Nome", "Raça", "Cor", "Sexo", "Ações"];
  const token = req.session.token || "";
  let currentUserRole = null; // <<-- ADICIONADO

  if (token) { // <<-- ADICIONADO Bloco if/else
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role; 
    } catch (error) {
      console.error("Erro ao decodificar token na rota '/pets':", error);
      // Token inválido ou expirado, redirecionar para login
      return res.redirect('/login'); 
    }
  } else {
    // Sem token, usuário não logado, redirecionar para login
    return res.redirect('/login');
  }
  
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` // Token é enviado para proteger a rota no backend
    }
  })
  .then(async (apiRes) => { // Renomeado para evitar conflito
    if(!apiRes.ok){
      const err = await apiRes.json();
      if (apiRes.status === 401 || apiRes.status === 403) { // Se backend negar acesso
          return res.redirect('/login');
      }
      throw err;
    }
    return apiRes.json();
  })
  .then((pets)=> {
    // Passando currentUserRole para a view
    res.render('layout', {body:'pages/pets', title, cols, pets, error: "", currentUserRole: currentUserRole}); // <<-- MODIFICADO
  })
  .catch((error)=> {
    console.log('Erro em /pets GET', error);
    // Em caso de outros erros, também redireciona para login ou uma página de erro
    res.redirect('/login'); 
  })
});

// POST NEW PET (corrigido para 'pet', não 'user')
router.post("/", (req, res) => {
  const { name, race, colour, gender } = req.body;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação de token antes do fetch
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url, {
    method: "POST",
    headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}` // <<-- MODIFICADO para incluir o header correto
    }, 
    body: JSON.stringify({ name, race, colour, gender })
  }).then(async (apiRes) => { // Renomeado
    if (!apiRes.ok){
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
  })
  .then((pet) => { // Renomeado para 'pet'
    res.send(pet);
  })
  .catch((error) =>{
    res.status(500).send(error);
  })
});

// UPDATE PET
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, race, colour, gender } = req.body;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url+'/'+id, {
    method: "PUT",
    headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}` // <<-- ADICIONADO header de autorização
    }, 
    body: JSON.stringify({ name, race, colour, gender })
  }).then(async (apiRes) => { // Renomeado
    if (!apiRes.ok){
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
  })
  .then((pet) => {
    res.send(pet);
  })
  .catch((error) =>{
    res.status(500).send(error);
  })
});

// DELETE PET
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url+'/'+id, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` // Header já existia e estava correto
    }
  }).then(async (apiRes) => { // Renomeado
    if (!apiRes.ok){ // Corrigido para apiRes
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
  })
  .then((pet) => {
    res.send(pet);
  })
  .catch((error) =>{
    res.status(500).send(error);
  })
});

// GET PET BY ID (para editar)
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || ""; // <<-- ADICIONADO

  if (!token) { // <<-- ADICIONADO verificação
     // Se esta rota serve dados para um formulário de edição que só deve ser acessível logado
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url+'/'+id, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` // Header já existia e estava correto
    }
  }).then(async (apiRes) => { // Renomeado
    if (!apiRes.ok){ // Corrigido para apiRes
      const err = await apiRes.json();
      throw err;
    }
    return apiRes.json();
  })
  .then((pet) => {
    res.send(pet);
  })
  .catch((error) =>{
    res.status(500).send(error);
  })
});
module.exports = router;