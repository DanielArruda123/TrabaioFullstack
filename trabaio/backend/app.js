var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//Libs Auth
var rateLimit = require('express-rate-limit');
var session = require('express-session')

const cors = require('cors');
var app = express();
app.use(express.json());

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

//Configuração de limite de requisições
const limiter = rateLimit({
  windowMS: 1 * 60 * 1000,
  max: 3,
  keyGenerator: (req, res) =>req.headers['x-forwarded-for'] || req.ip
});

//Configuração de sessão
app.use(session({
  secret: 'f7c74e23b069884c186e9c8f478b32522759e88e1d112ccf1e23ec25c2d4607b',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var petsRouter = require('./routes/pets');
var servicesRouter = require('./routes/services');
var productsRouter = require('./routes/products');
var tutorsRouter = require('./routes/tutors');
var solicitationsRouter = require('./routes/solicitations');
var authRouter = require('./routes/auth')

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/pets', petsRouter);
app.use('/tutors', tutorsRouter);
app.use('/services', servicesRouter);
app.use('/products', productsRouter);
app.use('/solicitations', solicitationsRouter);
app.use('/auth', limiter, authRouter)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({erro:'Not Found'});
});

module.exports = app;
