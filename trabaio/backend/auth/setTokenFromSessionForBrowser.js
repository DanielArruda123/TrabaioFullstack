function setTokenFromSessionForBrowser(req, res, next) {
    // Verifica se é uma requisição de navegador (não tem header Authorization normalmente)
    // E se existe um token na sessão do painel ADM do backend
    if (!req.headers.authorization && req.session && req.session.adminAccessToken) {
        // Adiciona o header Authorization para que verifyJWT e verifyAdmin funcionem
        req.headers.authorization = `Bearer ${req.session.adminAccessToken}`;
    }
    next();
}

module.exports = setTokenFromSessionForBrowser;