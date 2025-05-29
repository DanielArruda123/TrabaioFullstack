const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']; // corrigido aqui
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).send({ error: 'Token não encontrado' });
    }

    jwt.verify(token, process.env.TOKEN, (err, user) => {
        if (err) {
            return res.status(403).send({ error: 'Token inválido' }); // corrigido aqui
        }

        req.user = user; // corrigido aqui
        next();
    });
}

module.exports = authenticateToken;
