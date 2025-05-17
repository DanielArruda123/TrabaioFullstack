var express = require('express');
var router = express.Router();


const url = "http://localhost:4000/auth/login";

// GET home page.
router.get('/', function(req, res, next) {
  res.render('layout', { body: 'pages/login', title: 'Express', error:'' });
});

router.post('/',(req,res)=>{
    const {username, password} = req.body
    console.log('aqui chega', username, password)
    console.log('Body recebido:', req.body);
    
    fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    })
    .then(async(res) => {
        if (!res.ok){
            const err = await res.json()
            throw err
        }
        return res.json()
    })
    .then((data) => {
        req.session.token = data.token
        res.redirect('/pets')
    })
    .catch((error) =>{
    res.render('layout', {body: 'pages/login', title: 'Express', error})

    })
})

module.exports = router;