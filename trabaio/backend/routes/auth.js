var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const db = require('../database/config'); 

// Rota de login principal da API (usada pelo frontend) - SEM ALTERAÇÕES
router.post('/login', (req, res) => {
    // ... (código existente)
    const {username, password} = req.body;
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
                    const token = jwt.sign(
                        { id: row.id, username: row.username, role: row.role },
                        process.env.TOKEN, 
                        { expiresIn: '1h' } 
                    );
                    return res.status(200).send({message: 'Login com sucesso', token});
                }
            })
        }
    })
});


// === ROTAS PARA PAINEL ADM NO BACKEND (URLS MODIFICADAS) ===

// GET - Exibe o formulário de login de ADM
// AGORA ACESSÍVEL EM /auth/admin
router.get('/admin', (req, res) => { 
    // Se já estiver logado no painel ADM (tem token na sessão do backend), redireciona para os links
    if (req.session.adminAccessToken) {
        return res.redirect('/auth/admin/api-links');
    }
    res.render('admin-login-form', { error: null, title: 'Login ADM Backend' });
});

// POST - Processa o formulário de login de ADM
// O <form action> no admin-login-form.ejs precisará apontar para /auth/admin
router.post('/admin', (req, res) => { 
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('admin-login-form', { error: 'Usuário e senha são obrigatórios.', title: 'Login ADM Backend' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.log("Erro ao buscar usuário (admin-login):", err);
            return res.render('admin-login-form', { error: 'Erro interno do servidor.', title: 'Login ADM Backend' });
        }
        if (!row) {
            return res.render('admin-login-form', { error: 'Usuário não encontrado.', title: 'Login ADM Backend' });
        }

        bcrypt.compare(password, row.password, (bcryptErr, result) => {
            if (bcryptErr) {
                console.log("Erro ao comparar senhas (admin-login):", bcryptErr);
                return res.render('admin-login-form', { error: 'Erro ao processar login.', title: 'Login ADM Backend' });
            }
            if (!result) {
                return res.render('admin-login-form', { error: 'Senha incorreta.', title: 'Login ADM Backend' });
            }

            if (row.role !== 'ADM') {
                return res.render('admin-login-form', { error: 'Acesso negado. Esta área é apenas para administradores.', title: 'Login ADM Backend' });
            }

            const token = jwt.sign(
                { id: row.id, username: row.username, role: row.role },
                'f7c74e23b069884c186e9c8f478b32522759e88e1d112ccf1e23ec25c2d4607b',
                { expiresIn: '1h' }
            );
            
            req.session.adminAccessToken = token; 
            res.redirect('/auth/admin/api-links'); // Redireciona para a página de links
        });
    });
});

// GET - Página de links da API para ADM
// AGORA ACESSÍVEL EM /auth/admin/api-links
router.get('/admin/api-links', (req, res) => { 
    if (!req.session.adminAccessToken) {
        return res.redirect('/auth/admin'); // Redireciona para o login do painel se não tiver token na sessão
    }
    res.render('admin-api-links', { title: 'Painel ADM - Links da API' });
});

// Rota de Logout para o painel ADM do backend
// AGORA ACESSÍVEL EM /auth/admin/logout
router.get('/admin/logout', (req, res) => { 
    if (req.session.adminAccessToken) {
        delete req.session.adminAccessToken; 
    }
    res.redirect('/auth/admin'); // Redireciona para o login do painel
});

module.exports = router;