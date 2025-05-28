var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

const db = require('../database/config'); // Caminho relativo de 'routes' para 'database/config.js'

router.post('/login', (req, res) => {
    const {username, password} = req.body;
    // Sua query SELECT * FROM users já busca todas as colunas, incluindo 'username' e 'role'.
    db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
        if (err) { 
            console.log("Erro ao buscar usuário no banco", err);
            return res.status(500).send({ error: 'Erro interno do servidor' });
        }
        if (!row) {
            console.log("Usuário não encontrado"); 
            return res.status(404).send({ error: 'Usuário não encontrado'});
        } else {
            bcrypt.compare(password, row.password, (bcryptErr, result)=>{ 
                if (bcryptErr){
                    console.log("Erro ao comparar as senhas", bcryptErr);
                    return res.status(500).send({error: 'Erro ao comparar as senhas'});
                } else if (!result){
                    return res.status(401).send({error: 'Senha incorreta'});
                } else {
                    // **** MODIFICAÇÃO AQUI ****
                    // Incluir 'username' no payload do token
                    const token = jwt.sign(
                        { id: row.id, username: row.username, role: row.role }, // ADICIONADO: row.username
                        'f7c74e23b069884c186e9c8f478b32522759e88e1d112ccf1e23ec25c2d4607b', 
                        { expiresIn: '1h' } 
                    );
                    return res.status(200).send({message: 'Login com sucesso', token});
                }
            })
        }
    })
})

module.exports = router;