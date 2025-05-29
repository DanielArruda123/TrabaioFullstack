var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
require('../node_modules/dotenv').config({path:'../.env'});
var app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.use(session({
  secret: 'f7c74e23b069884c186e9c8f478b32522759e88e1d112ccf1e23ec25c2d4607b',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// IMPORT DAS ROTAS DE /ROUTES
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var petsRouter = require('./routes/pets');
var authRouter = require('./routes/auth');
var productsRouter = require('./routes/products');
var servicesRouter = require('./routes/services');
var solicitationsRouter = require('./routes/solicitations');
var tutorsRouter = require('./routes/tutors');
var clientServicesRouter = require('./routes/clientServices');
var clientProductsRouter = require('./routes/clientProducts');

// DEFININDO ENDPOINT PARA AS ROTAS IMPORTADAS
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/pets', petsRouter);
app.use('/login', authRouter);
app.use('/products', productsRouter);
app.use('/services', servicesRouter);
app.use('/solicitations', solicitationsRouter);
app.use('/tutors', tutorsRouter);
app.use('/userservices', clientServicesRouter);
app.use('/userproducts', clientProductsRouter);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
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
  res.render('error');
});

module.exports = app;