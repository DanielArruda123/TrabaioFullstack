var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database/database.db')

router.post('/login', (req, res) => {
    const {username, password} = req.body;
    // Certifique-se de que sua query SELECT está buscando a coluna 'role'
    // Como você alterou users.js para SELECT *, e 'role' está na tabela,
    // 'row.role' deve estar disponível.
    db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
        if (err) { // Adicionado para tratar erros de banco de dados
            console.log("Erro ao buscar usuário no banco", err);
            return res.status(500).send({ error: 'Erro interno do servidor' });
        }
        if (!row) {
            console.log("Usuário não encontrado"); // Removido 'err' daqui pois não é um erro de DB
            return res.status(404).send({ error: 'Usuário não encontrado'});
        } else {
            bcrypt.compare(password, row.password, (bcryptErr, result)=>{ // Renomeado 'err' para 'bcryptErr' para evitar conflito
                if (bcryptErr){
                    console.log("Erro ao comparar as senhas", bcryptErr);
                    return res.status(500).send({error: 'Erro ao comparar as senhas'});
                } else if (!result){
                    return res.status(401).send({error: 'Senha incorreta'});
                } else {
                    // Modificação AQUI: Adicionar 'role: row.role' ao payload do token
                    const token = jwt.sign(
                        { id: row.id, role: row.role }, // Incluindo o 'role' do usuário
                        'f7c74e23b069884c186e9c8f478b32522759e88e1d112ccf1e23ec25c2d4607b', // Sua chave secreta
                        { expiresIn: '1h' } // Aumentei a expiração para 1 hora
                    );
                    return res.status(200).send({message: 'Login com sucesso', token});
                }
            })
        }
    })
})

module.exports = router;