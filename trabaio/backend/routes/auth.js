var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const db = require('../database/config');

// As definições de 'tags' e 'components: schemas: LoginCredentials, LoginResponse, AdminLoginCredentials'
// foram movidas para app.js

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: Realiza o login do usuário e retorna um token JWT.
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/LoginCredentials'
 * responses:
 * 200:
 * description: Login bem-sucedido.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/LoginResponse'
 * 401:
 * description: Senha incorreta.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * 404:
 * description: Usuário não encontrado.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * 500:
 * description: Erro interno do servidor.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * security: []
 */
router.post('/login', (req, res) => {
    // ... (código da rota de login) ...
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

// /**
//  * @swagger
//  * /auth/admin:
//  * get:
//  * summary: Exibe o formulário de login do painel administrativo (página HTML).
//  * tags: [Auth]
//  * responses:
//  * 200:
//  * description: Formulário de login ADM.
//  * content:
//  * text/html:
//  * schema:
//  * type: string
//  * 302:
//  * description: Redireciona para /auth/admin/api-links se já estiver logado na sessão do painel.
//  * security: []
//  */
router.get('/admin', (req, res) => { 
    // ... (código da rota) ...
    if (req.session.adminAccessToken) {
        return res.redirect('/auth/admin/api-links');
    }
    res.render('admin-login-form', { error: null, title: 'Login ADM Backend' });
});

// /**
//  * @swagger
//  * /auth/admin:
//  * post:
//  * summary: Processa o login do painel administrativo (via formulário HTML).
//  * tags: [Auth]
//  * requestBody:
//  * required: true
//  * content:
//  * application/x-www-form-urlencoded:
//  * schema:
//  * $ref: '#/components/schemas/AdminLoginCredentials'
//  * responses:
//  * 302:
//  * description: Redireciona para /auth/admin/api-links em caso de sucesso, ou de volta para /auth/admin com erro.
//  * headers:
//  * Location:
//  * description: URL para redirecionamento.
//  * schema:
//  * type: string
//  * security: []
//  */
router.post('/admin', (req, res) => { 
    // ... (código da rota) ...
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
            res.redirect('/auth/admin/api-links');
        });
    });
});

// /**
//  * @swagger
//  * /auth/admin/api-links:
//  * get:
//  * summary: Exibe a página de links da API para administradores logados (página HTML).
//  * tags: [Auth]
//  * responses:
//  * 200:
//  * description: Página de links da API.
//  * content:
//  * text/html:
//  * schema:
//  * type: string
//  * 302:
//  * description: Redireciona para /auth/admin se não estiver logado na sessão do painel.
//  * security: []
//  */
router.get('/admin/api-links', (req, res) => { 
    // ... (código da rota) ...
    if (!req.session.adminAccessToken) {
        return res.redirect('/auth/admin');
    }
    res.render('admin-api-links', { title: 'Painel ADM - Links da API' });
});

// /**
//  * @swagger
//  * /auth/admin/logout:
//  * get:
//  * summary: Realiza o logout do painel administrativo e redireciona para o login do painel.
//  * tags: [Auth]
//  * responses:
//  * 302:
//  * description: Redireciona para /auth/admin.
//  * headers:
//  * Location:
//  * description: URL para redirecionamento.
//  * schema:
//  * type: string
//  * security: []
//  */
router.get('/admin/logout', (req, res) => { 
    // ... (código da rota) ...
    if (req.session.adminAccessToken) {
        delete req.session.adminAccessToken; 
    }
    res.redirect('/auth/admin');
});

module.exports = router;