var express = require('express');
var router = express.Router();
const { jwtDecode } = require('jwt-decode');
const url = process.env.BACK_URL + "/pets"; // URL do backend para pets

/* GET pets listing. */
router.get('/',  function (req, res, next) { // Esta rota renderiza sua página principal de listagem de pets
  let title = "Gestão de Pets";
  let cols = ["Nome", "Raça", "Cor", "Sexo", "Ações"];
  const token = req.session.token || "";
  let currentUserRole = null;

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      currentUserRole = decodedToken.role; 
    } catch (error) {
      console.error("Erro ao decodificar token na rota '/pets':", error);
      return res.redirect('/login'); 
    }
  } else {
    return res.redirect('/login');
  }
  
  // ESTA CHAMADA FETCH BUSCA OS PETS PARA A PÁGINA DE LISTAGEM PRINCIPAL
  fetch(url, { // Chamada para process.env.BACK_URL + "/pets" (backend)
    method: 'GET',
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`
    }
  })
  .then(async (apiRes) => {
    if(!apiRes.ok){
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta da API de pets."}));
      if (apiRes.status === 401 || apiRes.status === 403) {
        return res.redirect('/login');
      }
      throw err;
    }
    return apiRes.json();
  })
  .then((pets)=> {
    res.render('layout', {body:'pages/pets', title, cols, pets, error: "", currentUserRole: currentUserRole});
  })
  .catch((error)=> {
    console.log('Erro em /pets GET (frontend):', error);
    res.render('layout', { // Adicionado renderização de erro aqui também
        body:'pages/pets', 
        title, 
        cols, 
        pets: [], // Lista vazia em caso de erro
        error: error.message || "Erro ao carregar pets.", 
        currentUserRole: currentUserRole
    });
  })
});

// POST NEW PET
router.post("/", (req, res) => {
  const { name, race, colour, gender } = req.body;
  const token = req.session.token || "";

  if (!token) {
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url, {
    method: "POST",
    headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${token}`
    }, 
    body: JSON.stringify({ name, race, colour, gender })
  }).then(async (apiRes) => {
    if (!apiRes.ok){
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta da API."}));
      throw err;
    }
    return apiRes.json();
  })
  .then((pet) => {
    res.send(pet);
  })
  .catch((error) =>{
    console.error("Erro ao criar pet (frontend):", error);
    res.status(error.status || 500).send({ error: error.message || error.error || "Erro interno ao criar pet."});
  })
});

// UPDATE PET
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, race, colour, gender } = req.body;
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
    body: JSON.stringify({ name, race, colour, gender })
  }).then(async (apiRes) => {
    if (!apiRes.ok){
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta da API."}));
      throw err;
    }
    return apiRes.json();
  })
  .then((pet) => {
    res.send(pet);
  })
  .catch((error) =>{
    console.error("Erro ao atualizar pet (frontend):", error);
    res.status(error.status || 500).send({ error: error.message || error.error || "Erro interno ao atualizar pet."});
  })
});

// DELETE PET
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || "";

  if (!token) {
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url+'/'+id, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`
    }
  }).then(async (apiRes) => {
    if (!apiRes.ok){
      const err = await apiRes.json().catch(() => ({ error: "Erro ao processar resposta da API."}));
      throw err;
    }
    return apiRes.json().catch(() => ({ message: 'Pet deletado com sucesso' })); // Lida com resposta vazia do DELETE
  })
  .then((pet) => {
    res.send(pet);
  })
  .catch((error) =>{
    console.error("Erro ao deletar pet (frontend):", error);
    res.status(error.status || 500).send({ error: error.message || error.error || "Erro interno ao deletar pet."});
  })
});

// GET PET BY ID (para editar formulário de pet, se existir)
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const token = req.session.token || "";

  if (!token) {
    return res.status(401).send({ error: "Não autorizado: Token não fornecido" });
  }

  fetch(url+'/'+id, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}`
    }
  }).then(async (apiRes) => {
    if (!apiRes.ok){
      const err = await apiRes.json().catch(() => ({ error: "Pet não encontrado ou erro na API."}));
      throw err;
    }
    return apiRes.json();
  })
  .then((pet) => {
    res.send(pet);
  })
  .catch((error) =>{
    console.error("Erro ao buscar pet por ID (frontend):", error);
    res.status(error.status || 500).send({ error: error.message || error.error || "Erro interno ao buscar pet."});
  })
});

module.exports = router;