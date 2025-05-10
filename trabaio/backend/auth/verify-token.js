const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']; // corrigido aqui
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).send({ error: 'Token não encontrado' });
    }

    jwt.verify(token, 'f7c74e23b069884c186e9c8f478b32522759e88e1d112ccf1e23ec25c2d4607b', (err, user) => {
        if (err) {
            return res.status(403).send({ error: 'Token inválido' }); // corrigido aqui
        }

        req.user = user; // corrigido aqui
        next();
    });
}

module.exports = authenticateToken;
