const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']; // corrigido aqui
    const token = authHeader && authHeader.split(' ')[1];

    console.log('VerifyJWT: Recebido token:', token ? 'sim' : 'não'); // Log do token

    if (token == null) {
        console.log('VerifyJWT: Token null, retornando 401.');
        return res.status(401).send({ error: 'Token não encontrado' });
    }

    console.log('VerifyJWT: Tentando verificar token com segredo...'); // Log antes de verificar
    jwt.verify(token, process.env.TOKEN, (err, user) => {
        console.log('VerifyJWT: Resultado da verificação - Erro:', err, ', Usuário:', user); // Log do resultado da verificação
        if (err) {
            return res.status(403).send({ error: 'Token inválido' }); // corrigido aqui
        }

        req.user = user; // corrigido aqui
        next();
    });
}

module.exports = authenticateToken;
