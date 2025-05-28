const jwt = require('jsonwebtoken');
const verifyJWT = require('./verify-token'); // Reutiliza o verifyJWT para popular req.user

function verifyAdmin(req, res, next) {
    // Primeiro, verifica se o token é válido e se req.user é populado
    verifyJWT(req, res, (err) => { 
        // Se verifyJWT retornar um erro (ex: token inválido, expirado), ele já terá enviado uma resposta.
        // Então, se 'err' existir, não fazemos mais nada aqui.
        if (err) {
            return; // A resposta de erro já foi enviada por verifyJWT
        }

        // Se chegou aqui, verifyJWT chamou next() sem erro, e req.user deve estar disponível
        if (req.user && req.user.role === 'ADM') {
            next(); // Usuário é ADM, prossegue para a próxima função de middleware/rota
        } else {
            // Se não for ADM ou req.user não estiver definido corretamente
            res.status(403).send({ error: 'Acesso negado. Recurso disponível apenas para administradores.' });
        }
    });
}

module.exports = verifyAdmin;