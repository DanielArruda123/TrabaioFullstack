var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('../node_modules/dotenv').config({path:'../.env'});
// Libs Auth
var rateLimit = require('express-rate-limit');
var session = require('express-session');

const cors = require('cors');
const setTokenFromSessionForBrowser = require('./auth/setTokenFromSessionForBrowser'); // Middleware para ler token da sessão para o navegador

var app = express();

// Middlewares Globais - Ordem Importante
app.use(cors()); // CORS primeiro
app.use(logger('dev')); // Logger de requisições

// Middlewares para parsear o corpo da requisição
app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: false })); // Para parsear formulários urlencoded

app.use(cookieParser()); // Para parsear cookies

// Configuração de sessão (necessária para req.session.adminAccessToken)
app.use(session({
  secret: 'f7c74e23b069884c186e9c8f478b32522759e88e1d112ccf1e23ec25c2d4607b',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Em produção, use true se estiver usando HTTPS
    httpOnly: true, // Ajuda a prevenir ataques XSS
    sameSite: 'lax' // Ajuda a prevenir CSRF
  }
}));

// Middleware para pegar o token da sessão e colocar no header para verifyJWT/verifyAdmin
// Deve vir DEPOIS da configuração da sessão e ANTES das rotas
app.use(setTokenFromSessionForBrowser);

// Configuração da View Engine (você já tinha isso)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Servir arquivos estáticos da pasta 'public' do backend (se você tiver algum)
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de limite de requisições (pode ser global ou por rota)
const limiter = rateLimit({
  windowMS: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite cada IP a 100 requisições por janela
  keyGenerator: (req, res) => req.headers['x-forwarded-for'] || req.connection.remoteAddress
});
// Se quiser aplicar globalmente: app.use(limiter);
// Ou aplique a rotas específicas como você fez para /auth

// IMPORT DAS ROTAS
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var petsRouter = require('./routes/pets');
var servicesRouter = require('./routes/services');
var productsRouter = require('./routes/products');
var tutorsRouter = require('./routes/tutors');
var solicitationsRouter = require('./routes/solicitations');
var authRouter = require('./routes/auth');

// DEFINIÇÃO DAS ROTAS
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/pets', petsRouter);
app.use('/tutors', tutorsRouter);
app.use('/services', servicesRouter);
app.use('/products', productsRouter);
app.use('/solicitations', solicitationsRouter);
app.use('/auth', limiter, authRouter); // Limiter aplicado especificamente à rota de auth

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page ou envia JSON
  res.status(err.status || 500);
  // Se você tiver uma view error.ejs no backend para erros de API:
  // res.render('error'); 
  // Ou continue enviando JSON para erros de API:
  res.send({ error: err.message || 'Ocorreu um erro no servidor', details: (req.app.get('env') === 'development' ? err : undefined) });
});

module.exports = app;