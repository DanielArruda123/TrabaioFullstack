var express = require('express');
var router = express.Router();
const url = "http://localhost:4000/pets"; // Corrigido 'cons' para 'const'

/* GET pets listing. */
router.get('/',  function (req, res, next) {
  fetch(url, {method: 'GET'})
  .then(async (res) => {
    if(!res.ok){
      const err = await res.json()
      throw err
    }
    return res.json()
  })
  .then((pets)=> {
    let title = "Gestão de Pets"
    let cols = ["Nome", "Raça", "Cor", "Sexo", "Ações"]
    res.render('layout', {body:'pages/pets', title, pets, cols, error: ""})
  })
  .catch((error)=> {
    console.log('Erro', error)
    res.render('layout', {body:'pages/pets', title: "Gestão de Pets", error})
  })
  
})

// POST NEW PET
router.post("/", (req, res) => {
  const { name, race, colour, gender } = req.body;
  fetch(url + '/register', {
    method: "POST",
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ name, race, colour, gender })
  }).then(async (res) => {
    if (!res.ok){
      const err = await res.json()
      throw err
    }
    return res.json()
  })
  .then((pet) => {
    res.send(pet)
  })
  .catch((error) =>{
    res.status(500).send(error)
  })
});

// UPDATE PET
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, race, colour, gender } = req.body;
  fetch(url+'/'+id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ name, race, colour, gender })
  }).then(async (res) => {
    if (!res.ok){
      const err = await res.json()
      throw err
    }
    return res.json()
  })
  .then((pet) => {
    res.send(pet)
  })
  .catch((error) =>{
    res.status(500).send(error)
  })
});

// DELETE PET
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  fetch(url+'/'+id, {
    method: "DELETE",
  }).then(async (res) => {
    if (!res.ok){
      const err = await res.json()
      throw err
    }
    return res.json()
  })
  .then((pet) => {
    res.send(pet)
  })
  .catch((error) =>{
    res.status(500).send(error)
  })
});

// EDIT PET
router.get("/:id", (req, res) => {
  const { id } = req.params;
  fetch(url+'/'+id, {
    method: "GET",
  }).then(async (res) => {
    if (!res.ok){
      const err = await res.json()
      throw err
    }
    return res.json()
  })
  .then((pet) => {
    res.send(pet)
  })
  .catch((error) =>{
    res.status(500).send(error)
  })
});
module.exports = router;