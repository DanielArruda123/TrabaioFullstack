var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database/database.db')

router.post('/login', (req, res) => {
    console.log('Dados recebidos no login:', req.body);
    const {username, password} = req.body;
    
    if (!username || !password) {
        console.log('Username ou senha não fornecidos');
        return res.status(400).send({ error: 'Username e senha são obrigatórios' });
    }

    db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
        if (err) {
            console.log("Erro ao buscar usuário:", err);
            return res.status(500).send({ error: 'Erro ao buscar usuário' });
        }
        
        if (!row) {
            console.log("Usuário não encontrado");
            return res.status(404).send({ error: 'Usuário não encontrado' });
        }

        console.log('Usuário encontrado:', row.username);
        
        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                console.log("Erro ao comparar as senhas:", err);
                return res.status(500).send({ error: 'Erro ao comparar as senhas' });
            }
            
            if (!result) {
                console.log("Senha incorreta");
                return res.status(401).send({ error: 'Senha incorreta' });
            }

            console.log('Login bem sucedido');
            const token = jwt.sign(
                {id: row.id}, 
                'f7c74e23b069884c186e9c8f478b32522759e88e1d112ccf1e23ec25c2d4607b',
                { expiresIn: '1m' }
            );
            return res.status(200).send({ message: 'Login com sucesso', token });
        });
    });
});

module.exports = router;