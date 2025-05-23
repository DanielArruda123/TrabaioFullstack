var express = require('express');
var router = express.Router();
const url = "http://localhost:4000/pets"; 

/* GET pets listing. */
router.get('/',  function (req, res, next) {
  let title = "Gestão de Pets"
  let cols = ["ID", "Nome", "Raça", "Cor", "Sexo", "Ações"]

  const token = req.session.token || null;

  console.log(token)

  fetch(url, {method: 'GET', headers: {Authorization: `Bearer ${token}`}})
  .then(async (res) => {
    if(!res.ok){
      const err = await res.json()
      throw err
    }
    return res.json()
  })
  .then((pets)=> {
    res.render('layout', {body:'pages/pets', title,cols, pets, error: ""})
  })
  .catch((error)=> {
    console.log('Erro', error)
    res.render('layout', {body:'pages/pets', title, cols, error, cols, pets: []})
  })
})

// POST NEW USER
router.post("/", (req, res) => {
  const { name, race, colour, gender } = req.body;
  fetch(url, {
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
  .then((user) => {
    res.send(user)
  })
  .catch((error) =>{
    res.status(500).send(error)
  })
});

// UPDATE USER
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

// DELETE USER
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

// EDIT USER
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