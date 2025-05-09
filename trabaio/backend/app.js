var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();
app.use(express.json());

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var petsRouter = require('./routes/pets');
var servicesRouter = require('./routes/services');
var productsRouter = require('./routes/products');
var tutorsRouter = require('./routes/tutors');
var solicitationsRouter = require('./routes/solicitations');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/pets', petsRouter);
app.use('/tutors', tutorsRouter);
app.use('/services', servicesRouter);
app.use('/products', productsRouter);
app.use('/solicitations', solicitationsRouter);

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


const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

// Configurações da documentação Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Minha API',
      version: '1.0.0',
      description: 'Documentação com Swagger',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js'], // Caminho dos arquivos com comentários Swagger
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));